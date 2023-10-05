/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Stack } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

/**
 * Generate the lambda function invocation uri for the given lambda within the given scope
 * @param scope scope in which the lambda is deployed
 * @param lambdaFunction the lambda function to be invoked
 */
export const functionInvocationUri = (
  scope: Construct,
  lambdaFunction: IFunction
): string => {
  const stack = Stack.of(scope);
  return `arn:${stack.partition}:apigateway:${stack.region}:lambda:path/2015-03-31/functions/${lambdaFunction.functionArn}/invocations`;
};

/**
 * Generate the s3 bucket invocation uri for the given s3 within the given scope
 * @param scope scope in which the s3 is deployed
 * @param bucket the s3 bucket to be invoked
 */
export const bucketInvocationUri = (
  scope: Construct,
  bucket: IBucket,
  pathOverride?: string
): string => {
  const stack = Stack.of(scope);
  return `arn:${stack.partition}:apigateway:${stack.region}:s3:path/${
    bucket.bucketName
  }/${pathOverride ?? ""}`;
};
