/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { LambdaInterface } from "@aws-lambda-powertools/commons";
import { Logger } from "@aws-lambda-powertools/logger";
import { Metrics, MetricUnits } from "@aws-lambda-powertools/metrics";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { uuid } from "uuidv4";

const { CONNECTIONS_TABLE_NAME, NOTIFICATION_QUEUE_URL } = process.env;

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
const sqs = tracer.captureAWSv3Client(
  new SQSClient({ region: process.env.region })
);

const DEFAULT_TTL_SECONDS: number = 14400; // 4 hours

class Lambda implements LambdaInterface {
  @tracer.captureLambdaHandler()
  public async handler(
    event: APIGatewayProxyEvent,
    context: any
  ): Promise<any> {
    logger.addContext(context);
    logger.debug(JSON.stringify(event));
    logger.debug(JSON.stringify(context));

    // a default response to return if we succeed to process the request
    let response: APIGatewayProxyResult = { statusCode: 200, body: "OK" };

    // find the authenticated customerId from the request context
    let authenticatedCustomerId = event.requestContext.authorizer?.customerId;

    try {
      // get the current epochtime in seconds
      const createdAt: number = Math.round(Date.now() / 1000);
      const expireAt: number = createdAt + DEFAULT_TTL_SECONDS;

      // create the command to write the entry to ddb
      const putCommand = new PutCommand({
        TableName: CONNECTIONS_TABLE_NAME,
        Item: {
          connectionId: event.requestContext.connectionId,
          userId: authenticatedCustomerId,
          createdAt,
          expireAt,
        },
      });

      logger.debug(
        `Inserting connection details for ${event.requestContext.connectionId}/${authenticatedCustomerId}`
      );
      // send the command to ddb and await the result
      await ddb.send(putCommand);

      // send the metrics to cloudwatch
      metrics.addMetric("newConnection", MetricUnits.Count, 1);
      metrics.publishStoredMetrics();

      const sendMessageCommandInput: SendMessageCommandInput = {
        QueueUrl: NOTIFICATION_QUEUE_URL,
        MessageGroupId: uuid(),
        MessageBody: JSON.stringify({
          Event: "onConnect",
          Data: {
            userId: authenticatedCustomerId,
            connectionId: event.requestContext.connectionId,
            timestamp: Math.round(Date.now() / 1000),
            sourceIp: event.requestContext.identity.sourceIp,
          },
        }),
      };

      await sqs.send(new SendMessageCommand(sendMessageCommandInput));
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
