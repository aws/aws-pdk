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
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  QueryCommand,
  QueryCommandInput,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyResult, SQSEvent } from "aws-lambda";

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

class Lambda implements LambdaInterface {
  @tracer.captureLambdaHandler()
  public async handler(event: SQSEvent, context: any): Promise<any> {
    logger.debug(JSON.stringify(event));
    logger.debug(JSON.stringify(context));

    // a default response to return if we succeed to process the request
    let response: APIGatewayProxyResult = { statusCode: 200, body: "OK" };

    const onConnectHandler = async (message: any): Promise<void> => {
      logger.info(`onConnectHandler`);
      const getNotificationsCommandInput: QueryCommandInput = {
        TableName: NOTIFICATIONS_TABLE_NAME,
        IndexName: "notificationsUserIndex",
        KeyConditionExpression: "#userId = :userId",
        FilterExpression: "#dismissed = :dismissed",
        ExpressionAttributeValues: {
          ":userId": message.userId,
          ":dismissed": false,
        },
        ExpressionAttributeNames: {
          "#userId": "userId",
          "#dismissed": "dismissed",
        },
      };

      try {
        const notifications = await ddb.send(
          new QueryCommand(getNotificationsCommandInput)
        );

        for (const notification of notifications.Items!) {
          await api.send(
            new PostToConnectionCommand({
              ConnectionId: message.connectionId,
              Data: Buffer.from(
                JSON.stringify({
                  action: "NEW_NOTIFICATION",
                  notification: { ...notification },
                })
              ),
            })
          );
          metrics.addMetric("sentNotifications", MetricUnits.Count, 1);
          logger.info(
            `sent notification ${notification.notificationId} to ${message.connectionId}`
          );
        }
      } catch (error: any) {
        logger.error(error);
        throw error;
      }
    };

    try {
      for (const item of event.Records) {
        const message = JSON.parse(item.body);

        switch (message.Event) {
          case "onConnect":
            await onConnectHandler(message.Data);
            break;
          default:
            logger.warn("unhandled message event");
        }
      }
      metrics.publishStoredMetrics();
    } catch (error: any) {
      logger.error(error);
      // get error
      var body = error.stack || JSON.stringify(error, null, 2);
      // send a 500 error with the error body
      response = { statusCode: 500, body: body };
    }
    // return a 200, or 500 response
    return response;
  }
}

// export the handler class
export const handlerClass = new Lambda();

// export the handler function
export const handler = handlerClass.handler;
