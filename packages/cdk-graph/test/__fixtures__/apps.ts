/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  App,
  AppProps,
  CfnOutput,
  NestedStack,
  Stack,
  StackProps,
  Stage,
  StageProps,
} from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { ENVIRONMENTS } from "./common";

export class FixtureStack extends Stack {
  readonly bucket: s3.IBucket;
  readonly importedBucket: s3.IBucket;
  readonly lambda: lambda.IFunction;
  readonly importedLambda: lambda.IFunction;
  readonly db: rds.IDatabaseInstance;
  readonly role: iam.IRole;
  readonly vpc: ec2.Vpc;
  readonly webServer: ec2.Instance;
  readonly bastion: ec2.Instance;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      env: ENVIRONMENTS.DEFAULT,
      ...props,
    });

    this.bucket = new s3.Bucket(this, "Bucket");

    this.importedBucket = s3.Bucket.fromBucketName(
      this,
      "ImportedBucket",
      `imported-bucket-${ENVIRONMENTS.DEFAULT.account}-${ENVIRONMENTS.DEFAULT.region}`
    );

    this.lambda = new lambda.Function(this, "LambdaFunction", {
      code: lambda.Code.fromInline('module.console.log("test")'),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        BUCKET_ARN: this.bucket.bucketArn,
        BUCKET_NAME: this.bucket.bucketName,
      },
    });

    this.importedLambda = lambda.Function.fromFunctionName(
      this,
      "ImportedLambda",
      "imported-lambda"
    );

    new lambda.Alias(this, "LambdaAlias", {
      aliasName: "Test",
      version: this.lambda.latestVersion,
    });

    this.role = new iam.Role(this, "Role", {
      assumedBy: new iam.AccountPrincipal(this.account),
      inlinePolicies: {
        readBucket: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["*"],
              resources: [
                this.bucket.bucketArn,
                this.bucket.arnForObjects("*"),
                this.importedBucket.bucketArn,
                this.importedBucket.arnForObjects("*"),
              ],
            }),
          ],
        }),
        invokeLambda: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["*"],
              resources: [
                this.lambda.functionArn,
                this.importedLambda.functionArn,
              ],
            }),
          ],
        }),
      },
    });

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      natGateways: 1,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });
    this.vpc = vpc;

    const webSecurityGroup = new ec2.SecurityGroup(this, "WebSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "allow SSH access from anywhere"
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "allow HTTP traffic from anywhere"
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "allow HTTPS traffic from anywhere"
    );

    const webserverRole = new iam.Role(this, "webserver-role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
      ],
    });

    this.webServer = new ec2.Instance(this, "WebServer", {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: webserverRole,
      securityGroup: webSecurityGroup,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.C5,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: "web-ec2-key-pair",
    });

    this.bastion = new ec2.Instance(this, "Bastion", {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: "bastion-ec2-key-pair",
    });

    this.db = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MEDIUM
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    this.exportValue(this.role.roleArn);

    new CfnOutput(this, "BucketOutput", {
      value: this.bucket.bucketName,
      description: "Bucket name",
    });
  }
}

export class DependentFixtureStack extends Stack {
  readonly lambda: lambda.IFunction;
  readonly role: iam.IRole;

  readonly nestedStack: NestedStack;

  constructor(
    scope: Construct,
    id: string,
    props: { depStack: FixtureStack } & StackProps
  ) {
    super(scope, id, {
      env: ENVIRONMENTS.DEFAULT,
      ...props,
    });

    const { bucket } = props.depStack;

    const nestedStack = new NestedStack(this, "ResourceStack");
    this.nestedStack = nestedStack;

    this.lambda = new lambda.Function(nestedStack, "LambdaFunction", {
      code: lambda.Code.fromInline('module.console.log("test")'),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        BUCKET_ARN: bucket.bucketArn,
        BUCKET_NAME: bucket.bucketName,
      },
    });

    this.role = new iam.Role(nestedStack, "Role", {
      assumedBy: new iam.AccountPrincipal(this.account),
      inlinePolicies: {
        readBucket: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["*"],
              resources: [bucket.bucketArn, bucket.arnForObjects("*")],
            }),
          ],
        }),
        invokeLambda: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["*"],
              resources: [
                this.lambda.functionArn,
                props.depStack.lambda.functionArn,
              ],
            }),
          ],
        }),
      },
    });

    this.exportValue(this.lambda.functionName);
    this.exportValue(this.role.roleName);
  }
}

export class FixtureApp extends App {
  readonly stack: FixtureStack;

  constructor(props?: AppProps) {
    super(props);

    this.stack = new FixtureStack(this, "FixtureStack");
  }
}

export class MultiFixtureApp extends FixtureApp {
  readonly dependentStack: DependentFixtureStack;

  constructor(props?: AppProps) {
    super(props);

    this.dependentStack = new DependentFixtureStack(this, "DependentStack", {
      depStack: this.stack,
    });
  }
}

export class TestStage extends Stage {
  readonly stack: FixtureStack;
  readonly dependentStack: DependentFixtureStack;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    this.stack = new FixtureStack(this, "FixtureStack");
    this.dependentStack = new DependentFixtureStack(this, "DependentStack", {
      depStack: this.stack,
    });
  }
}

export class StagedApp extends App {
  readonly dev: TestStage;
  readonly staging: TestStage;
  readonly prod: TestStage;

  constructor(props?: AppProps) {
    super(props);

    this.dev = new TestStage(this, "Dev");
    this.staging = new TestStage(this, "Staging");
    this.prod = new TestStage(this, "Prod");
  }
}
