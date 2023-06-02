/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../pdk-project";

/**
 * Contains configuration for the aws-arch project.
 */
export class NotificationsProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "notifications",
      keywords: [
        "aws",
        "pdk",
        "jsii",
        "projen",
        "icons",
        "assets",
        "cfnspec",
        "websocket",
        "notification",
        "sqs",
      ],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      deps: ["@aws-prototyping-sdk/pdk-nag@^0.x"],
      bundledDeps: [
        "@aws-lambda-powertools/commons",
        "@aws-lambda-powertools/logger",
        "@aws-lambda-powertools/metrics",
        "@aws-lambda-powertools/tracer",
        "@aws-sdk/client-s3",
        "@aws-sdk/client-dynamodb",
        "@aws-sdk/lib-dynamodb",
        "@aws-sdk/util-dynamodb",
        "@aws-sdk/client-apigatewaymanagementapi",
        "@aws-sdk/client-sqs",
        "aws-lambda",
        "aws-jwt-verify",
        "uuidv4",
        "@types/aws-lambda",
      ],
      devDeps: [
        "projen",
        "aws-cdk-lib",
        "constructs",
        "cdk-nag",
        "@aws-cdk/aws-apigatewayv2-alpha",
        "@aws-cdk/aws-apigatewayv2-authorizers-alpha",
        "@aws-cdk/aws-apigatewayv2-integrations-alpha",
      ],
      peerDeps: [
        "projen",
        "aws-cdk-lib",
        "constructs",
        "cdk-nag",
        "@aws-cdk/aws-apigatewayv2-alpha",
        "@aws-cdk/aws-apigatewayv2-authorizers-alpha",
        "@aws-cdk/aws-apigatewayv2-integrations-alpha",
      ],
      stability: Stability.EXPERIMENTAL,
    });

    this.tsconfig?.addExclude("src/lib/handlers");
    this.tsconfigDev?.addExclude("src/lib/handlers");

    this.eslint?.addIgnorePattern("src/lib/handlers/**");
  }
}
