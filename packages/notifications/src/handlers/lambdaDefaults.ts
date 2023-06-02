/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { join } from "path";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
/**
 * Properties for lambda function
 *
 * @export
 * @interface NodejsFunctionInputProps
 */
export interface NodejsFunctionInputProps {
  connectionTableName: string;
  notificationsTableName: string;
  cognitoUserPoolId?: string;
  cognitoWebClientId?: string;
  runtime?: Runtime;
  logLevel?: string;
}
/**
 * Defaults for lambda function props
 *
 * @param props NodejsFunctionInputProps
 * @returns NodejsFunctionProps
 */
export const functionProps = (
  props: NodejsFunctionInputProps
): NodejsFunctionProps => {
  return {
    depsLockFilePath: join(__dirname, "../../../../../yarn.lock"),
    environment: {
      CONNECTIONS_TABLE_NAME: props.connectionTableName,
      NOTIFICATIONS_TABLE_NAME: props.notificationsTableName,
      COGNITO_USER_POOL_ID: props?.cognitoUserPoolId!,
      COGNITO_CLIENT_ID: props?.cognitoWebClientId!,
      LOG_LEVEL: props.logLevel ? props.logLevel : "DEBUG",
    },
    handler: "handler",
    runtime: props.runtime ? props.runtime : Runtime.NODEJS_18_X,
    tracing: Tracing.ACTIVE,
  };
};
