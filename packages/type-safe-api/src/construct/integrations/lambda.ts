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

  private getOperationPermissionId(operationId: string) {
    return `LambdaPermission-${operationId}`;
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
    operationLookup,
  }: IntegrationGrantProps) {
    // Router permissions are unique to a function
    const routerPermissionId = `LambdaRouterPermission-${this.lambdaFunction.node.addr.slice(
      -8
    )}`;

    // Check if we've already granted a router permission for this lambda
    if (scope.node.tryFindChild(routerPermissionId)) {
      return; // The function already has access to all operations
    }

    // Check if a permission has been added for other operations for the same function arn
    const otherOperationPermissions = Object.keys(operationLookup)
      .map((opId) =>
        scope.node.tryFindChild(this.getOperationPermissionId(opId))
      )
      .filter(
        (permission) =>
          permission &&
          permission instanceof CfnPermission &&
          permission.functionName === this.lambdaFunction.functionArn
      ) as CfnPermission[];

    if (otherOperationPermissions.length > 0) {
      // This lambda function is reused, so we add the "router permission" which allows
      // invocation for any operation, to save exceeding the policy size limit for large
      // numbers of operations.
      otherOperationPermissions.forEach((permission) =>
        scope.node.tryRemoveChild(permission.node.id)
      );
      new CfnPermission(scope, routerPermissionId, {
        action: "lambda:InvokeFunction",
        principal: "apigateway.amazonaws.com",
        functionName: this.lambdaFunction.functionArn,
        sourceArn: Stack.of(scope).formatArn({
          service: "execute-api",
          resource: api.restApiId,
          // Permissions for all
          resourceName: "*/*/*",
        }),
      });
    } else {
      // Add an individual operation permission since this lambda is not reused for multiple operations
      new CfnPermission(scope, this.getOperationPermissionId(operationId), {
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
}
