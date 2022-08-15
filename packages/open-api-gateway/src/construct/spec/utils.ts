/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
import { Stack } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
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
