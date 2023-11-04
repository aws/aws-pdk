/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Stack } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { IBucket } from "aws-cdk-lib/aws-s3";

/**
 * Generate the lambda function invocation uri for the given lambda within the given scope
 * @param lambdaFunction the lambda function to be invoked
 */
export const functionInvocationUri = (lambdaFunction: IFunction): string => {
  const stack = Stack.of(lambdaFunction);
  return `arn:${stack.partition}:apigateway:${stack.region}:lambda:path/2015-03-31/functions/${lambdaFunction.functionArn}/invocations`;
};

/**
 * Generate the s3 bucket invocation uri for the given s3 within the given scope
 * @param bucket the s3 bucket to be invoked
 * @param path? the path to object to invoke, default to none
 */
export const bucketInvocationUri = (bucket: IBucket, path?: string): string => {
  const stack = bucket.stack;
  return `arn:${stack.partition}:apigateway:${stack.region}:s3:path/${
    bucket.bucketName
  }/${path ?? ""}`;
};
