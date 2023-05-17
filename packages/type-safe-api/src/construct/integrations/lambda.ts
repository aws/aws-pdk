/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Stack } from "aws-cdk-lib";
import { CfnPermission, IFunction } from "aws-cdk-lib/aws-lambda";
import {
  ApiGatewayIntegration,
  Integration,
  IntegrationGrantProps,
  IntegrationRenderProps,
} from "./integration";
import { functionInvocationUri } from "../spec/utils";

/**
 * A lambda integration
 */
export class LambdaIntegration extends Integration {
  private readonly lambdaFunction: IFunction;

  constructor(lambdaFunction: IFunction) {
    super();
    this.lambdaFunction = lambdaFunction;
  }

  /**
   * Render the lambda integration as a snippet of OpenAPI
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      type: "AWS_PROXY",
      httpMethod: "POST",
      uri: functionInvocationUri(props.scope, this.lambdaFunction),
      passthroughBehavior: "WHEN_NO_MATCH",
    };
  }

  /**
   * Grant API Gateway permissions to invoke the lambda
   */
  public grant({
    scope,
    api,
    operationId,
    method,
    path,
  }: IntegrationGrantProps) {
    new CfnPermission(scope, `LambdaPermission-${operationId}`, {
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      functionName: this.lambdaFunction.functionArn,
      sourceArn: Stack.of(scope).formatArn({
        service: "execute-api",
        resource: api.restApiId,
        // Scope permissions to any stage and a specific method and path of the operation.
        // Path parameters (eg {param} are replaced with wildcards)
        resourceName: `*/${method.toUpperCase()}${path.replace(
          /{[^\}]*\}/g,
          "*"
        )}`,
      }),
    });
  }
}
