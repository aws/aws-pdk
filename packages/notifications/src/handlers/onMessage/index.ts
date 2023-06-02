/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics, MetricUnits } from "@aws-lambda-powertools/metrics";
import { Tracer } from "@aws-lambda-powertools/tracer";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const { NOTIFICATIONS_TABLE_NAME, WS_HTTPS_ENDPOINT, WS_API_STAGE } =
  process.env;

const logger = new Logger({
  serviceName: "notificationService",
  logLevel: "DEBUG",
});
const tracer = new Tracer({ serviceName: "notificationService" });
const metrics = new Metrics({
  serviceName: "notificationService",
  namespace: "notificationService",
});
const ddb = tracer.captureAWSv3Client(
  DynamoDBDocumentClient.from(
    new DynamoDBClient({
      apiVersion: "2012-08-10",
      region: process.env.AWS_REGION,
    })
  )
);
const api = tracer.captureAWSv3Client(
  new ApiGatewayManagementApiClient({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION,
    endpoint: `${WS_HTTPS_ENDPOINT}/${WS_API_STAGE}`,
  })
);

enum NOTIFICATION_ACTIONS {
  DISMISS_NOTIFICATION = "DISMISS_NOTIFICATION",
  ACKNOWLEDGE_NOTIFICATION = "ACKNOWLEDGE_NOTIFICATION",
}

export interface DismissNotificationProps {
  id: string;
  dismissedBy: string;
}

export interface AcknowledgedNotificationProps {
  id: string;
  acknowledgedBy: string;
}

class Lambda implements LambdaInterface {
  protected _apiGatewayEndpoint!: string;

  @tracer.captureLambdaHandler()
  public async handler(
    event: APIGatewayProxyEvent,
    context: any
  ): Promise<APIGatewayProxyResult> {
    let response: APIGatewayProxyResult = { statusCode: 200, body: "" };
    this._apiGatewayEndpoint =
      event.requestContext.domainName + "/" + event.requestContext.stage;
    logger.addContext(context);

    const acknowledgeNotification = async (
      props: AcknowledgedNotificationProps
    ): Promise<void> => {
      const updateItemCommandInput = {
        TableName: NOTIFICATIONS_TABLE_NAME,
        Key: {
          id: { S: props.id },
        },
        UpdateExpression:
          "set #acknowledged = :acknowledged, #acknowledgedAt = :acknowledgedAt, #acknowledgedBy = :acknowledgedBy",
        ExpressionAttributeNames: {
          "#acknowledged": "acknowledged",
          "#acknowledgedAt": "acknowledgedAt",
          "#acknowledgedBy": "acknowledgedBy",
        },
        ExpressionAttributeValues: {
          ":acknowledged": { BOOL: true },
          ":acknowledgedAt": { N: `${Date.now()}` },
          ":acknowledgedBy": { S: props.acknowledgedBy },
        },
      };
      try {
        await ddb.send(new UpdateItemCommand(updateItemCommandInput));
        await api.send(
          new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: Buffer.from(
              JSON.stringify({
                action: "ACKNOWLEDGE_NOTIFICATION",
                notification: { ...props },
              })
            ),
          })
        );
      } catch (err: any) {
        logger.error(err);
      }
    };

    const dismissNotification = async (
      props: DismissNotificationProps
    ): Promise<void> => {
      const updateItemCommandInput: UpdateItemCommandInput = {
        TableName: NOTIFICATIONS_TABLE_NAME,
        Key: {
          id: { S: props.id },
        },
        UpdateExpression: `set #acknowledged = :acknowledged, 
            #acknowledgedAt = :acknowledgedAt, 
            #dismissed = :dismissed, 
            #dismissedAt = :dismissedAt,
            #dismissedBy = :dismissedBy
          `,
        ExpressionAttributeNames: {
          "#acknowledged": "acknowledged",
          "#dismissed": "dismissed",
          "#acknowledgedAt": "acknowledgedAt",
          "#dismissedAt": "dismissedAt",
          "#dismissedBy": "dismissedBy",
        },
        ExpressionAttributeValues: {
          ":dismissed": { BOOL: true },
          ":dismissedAt": { N: `${Date.now()}` },
          ":acknowledged": { BOOL: true },
          ":acknowledgedAt": { N: `${Date.now()}` },
          ":dismissedBy": { S: props.dismissedBy },
        },
      };

      try {
        await ddb.send(new UpdateItemCommand(updateItemCommandInput));
        await api.send(
          new PostToConnectionCommand({
            ConnectionId: event.requestContext.connectionId,
            Data: Buffer.from(
              JSON.stringify({
                action: "DISMISS_NOTIFICATION",
                notification: { ...props },
              })
            ),
          })
        );
      } catch (err: any) {
        logger.error(err);
      }
    };

    try {
      const message = JSON.parse(event.body!);

      switch (message.action) {
        case NOTIFICATION_ACTIONS.DISMISS_NOTIFICATION:
          await dismissNotification({
            id: message.id,
            dismissedBy: message.dismissedBy,
          });
          metrics.addMetric("dismissedNotifications", MetricUnits.Count, 1);
          break;
        case NOTIFICATION_ACTIONS.ACKNOWLEDGE_NOTIFICATION:
          await acknowledgeNotification({
            id: message.id,
            acknowledgedBy: message.acknowledgedBy,
          });
          metrics.addMetric("acknowledgedNotifications", MetricUnits.Count, 1);
          break;
        default:
          logger.error("Unknown action");
      }

      /**
       * onNotificationAcknowledge
       * onNotificationDismissed
       */

      metrics.publishStoredMetrics();
    } catch (e: any) {
      logger.error(e);
      response = { statusCode: 500, body: e.stack };
    }

    return response;
  }
}

export const handlerClass = new Lambda();
export const handler = handlerClass.handler;
