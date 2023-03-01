/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CfnOutput, Stack } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { ENVIRONMENTS } from "./common";

export class DataLayer extends Construct {
  readonly bucket: s3.Bucket;
  readonly db: rds.DatabaseInstance;
  readonly readRole: iam.Role;

  constructor(scope: Construct, id: string, props: { vpc: ec2.Vpc }) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, "Bucket");

    this.db = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    this.readRole = new iam.Role(this, "ReadRole", {
      assumedBy: new iam.AccountPrincipal(Stack.of(this).account),
      inlinePolicies: {
        readBucket: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["s3:Get*", "s3:List*"],
              resources: [
                this.bucket.bucketArn,
                this.bucket.arnForObjects("*"),
              ],
            }),
          ],
        }),
        readDB: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["rds:*"],
              resources: [this.db.instanceArn],
            }),
          ],
        }),
      },
    });
  }
}

export class NetworkLayer extends Construct {
  readonly vpc: ec2.Vpc;
  readonly webServer: ec2.Instance;
  readonly bastion: ec2.Instance;

  constructor(scope: Construct, id: string) {
    super(scope, id);

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

    const getParameter = new cr.AwsCustomResource(this, "GetUserDataParam", {
      onUpdate: {
        service: "SSM",
        action: "getParameter",
        parameters: {
          Name: "my-parameter",
          WithEncryption: true,
        },
        physicalResourceId: cr.PhysicalResourceId.of("GetUserDataParam"),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const parameterValue = getParameter.getResponseField("Parameter.Value");

    const commandsUserData = ec2.UserData.forLinux();
    commandsUserData.addCommands(`echo ${parameterValue}`);

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
      userData: commandsUserData,
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
  }
}

export class ApiLayer extends Construct {
  readonly api: apigateway.RestApi;
  readonly helloHandler: lambda.Function;
  readonly worldHandler: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: { bucket: s3.Bucket; db: rds.DatabaseInstance }
  ) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, "ApiGateway");

    this.api.root.addMethod("ANY");

    const hello = this.api.root.addResource("hello");
    this.helloHandler = new lambda.Function(this, "HelloHandler", {
      code: lambda.Code.fromInline('module.exports.handler = () => "hello";'),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        BUCKET: props.bucket.bucketName,
        DB: props.db.instanceArn,
      },
    });
    props.bucket.grantRead(this.helloHandler);
    props.db.grantConnect(this.helloHandler);
    hello.addMethod("GET", new apigateway.LambdaIntegration(this.helloHandler));

    const world = this.api.root.addResource("world");
    this.worldHandler = new lambda.Function(this, "WorldHandler", {
      code: lambda.Code.fromInline('module.exports.handler = () => "world";'),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_18_X,
    });
    world.addMethod("GET", new apigateway.LambdaIntegration(this.worldHandler));
  }
}

export class Website extends Construct {
  readonly sourceBucket: s3.Bucket;
  readonly webDistribution: cloudfront.CloudFrontWebDistribution;

  constructor(
    scope: Construct,
    id: string,
    props: { api: apigateway.RestApi }
  ) {
    super(scope, id);

    this.sourceBucket = new s3.Bucket(this, "SourceBucket");

    const configHandler = new lambda.Function(this, "ConfigHandler", {
      code: lambda.Code.fromInline(
        'module.exports.handler = () => "do something to provide config";'
      ),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        BUCKET_ARN: this.sourceBucket.bucketArn,
        BUCKET_NAME: this.sourceBucket.bucketName,
        API_URL: props.api.url,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["s3:*"],
          resources: [
            this.sourceBucket.bucketArn,
            this.sourceBucket.arnForObjects("*"),
          ],
        }),
        new iam.PolicyStatement({
          actions: ["apigateway:*"],
          resources: [props.api.arnForExecuteApi()],
        }),
      ],
    });

    new cr.Provider(this, "ConfigProvider", {
      onEventHandler: configHandler,
    });

    this.webDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "WebDistro",
      {
        originConfigs: [
          {
            s3OriginSource: { s3BucketSource: this.sourceBucket },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    new CfnOutput(this, "WebsiteBucketOutput", {
      value: this.sourceBucket.bucketName,
      description: "Bucket name",
    });
  }
}

export class EdgeCases extends Construct {
  readonly importedBucket: s3.IBucket;
  readonly importedLambda: lambda.IFunction;

  constructor(scope: Construct) {
    super(scope, "EdgeCases");

    // lambda alias
    new lambda.Function(this, "LambdaWithAlias", {
      code: lambda.Code.fromInline('module.exports.handler = () => "foobar";'),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    }).addAlias("Test");

    // External (imported) resources
    this.importedBucket = s3.Bucket.fromBucketName(
      this,
      "ImportedBucket",
      `imported-bucket-${ENVIRONMENTS.DEFAULT.account}-${ENVIRONMENTS.DEFAULT.region}`
    );

    this.importedLambda = lambda.Function.fromFunctionName(
      this,
      "ImportedLambda",
      "imported-lambda"
    );
    new iam.Role(this, "ImportedResourceRole", {
      assumedBy: new iam.AccountPrincipal(ENVIRONMENTS.DEFAULT.account),
      inlinePolicies: {
        readBucket: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["*"],
              resources: [
                this.importedBucket.bucketArn,
                this.importedLambda.functionArn,
              ],
            }),
          ],
        }),
      },
    });
  }
}
