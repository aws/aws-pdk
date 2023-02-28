/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NestedStack, Stack, StackProps } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import {
  ApiLayer,
  DataLayer,
  EdgeCases,
  NetworkLayer,
  Website,
} from "./constructs";
import { ENVIRONMENTS } from "./env";

export class FixtureStack extends Stack {
  readonly networkingLayer: NetworkLayer;
  readonly dataLayer: DataLayer;
  readonly apiLayer: ApiLayer;
  readonly website: Website;
  readonly edgeCases: EdgeCases;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      env: ENVIRONMENTS.DEFAULT,
      ...props,
    });

    this.networkingLayer = new NetworkLayer(this, "NetworkingLayer");
    this.dataLayer = new DataLayer(this, "DataLayer", {
      vpc: this.networkingLayer.vpc,
    });
    this.apiLayer = new ApiLayer(this, "ApiLayer", {
      bucket: this.dataLayer.bucket,
      db: this.dataLayer.db,
    });
    this.website = new Website(this, "Website", { api: this.apiLayer.api });
    this.edgeCases = new EdgeCases(this);

    this.exportValue(this.dataLayer.readRole.roleArn);
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

    const nestedStack = new NestedStack(this, "ResourceStack");
    this.nestedStack = nestedStack;

    this.lambda = new lambda.Function(nestedStack, "LambdaFunction", {
      code: lambda.Code.fromInline('module.console.log("test")'),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        BUCKET_ARN: props.depStack.dataLayer.bucket.bucketArn,
        BUCKET_NAME: props.depStack.dataLayer.bucket.bucketName,
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
              resources: [
                props.depStack.dataLayer.bucket.bucketArn,
                props.depStack.dataLayer.bucket.arnForObjects("*"),
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
                props.depStack.apiLayer.api.arnForExecuteApi(),
                props.depStack.apiLayer.helloHandler.functionArn,
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
