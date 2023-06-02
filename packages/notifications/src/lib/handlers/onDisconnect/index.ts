// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Logger } from '@aws-lambda-powertools/logger';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand, DynamoDBDocumentClient, DeleteCommand, DeleteCommandInput } from "@aws-sdk/lib-dynamodb";

const { CONNECTIONS_TABLE_NAME } = process.env;
const logger = new Logger({ serviceName: 'notificationService', logLevel: 'DEBUG' });
const tracer = new Tracer({ serviceName: 'notificationService' });
const metrics = new Metrics({ namespace: 'notificationService' });

const ddb = tracer.captureAWSv3Client(DynamoDBDocumentClient.from(new DynamoDBClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION })));

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler(event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> {

    logger.addContext(context);
    let response: APIGatewayProxyResult = { statusCode: 200, body: "OK" };



    try {

      const queryCommand = new QueryCommand({
        TableName: CONNECTIONS_TABLE_NAME,
        KeyConditionExpression: "#connectionId = :id",
        ExpressionAttributeNames: {
          "#connectionId": "connectionId"
        },
        ExpressionAttributeValues: {
          ":id": event.requestContext.connectionId,
        }
      })
      //Query connection table to check for userId
      let connectionData = await ddb.send(queryCommand);

      logger.debug("Retrieved connection items: ", connectionData);

      // If connection is found, broadcase a status change event and delete the record
      if (connectionData!.Items!.length > 0) {

        const deleteParams: DeleteCommandInput = {
          TableName: CONNECTIONS_TABLE_NAME,
          Key: {
            connectionId: event.requestContext.connectionId,
            createdAt: connectionData!.Items![0].createdAt
          }
        };
        // delete the connection entry from the table
        logger.debug(`Deleting connection details ${JSON.stringify(deleteParams)}`);
        const deleteCommand = new DeleteCommand(deleteParams);
        await ddb.send(deleteCommand);

        metrics.addMetric('closedConnection', MetricUnits.Count, 1);
        metrics.publishStoredMetrics();
      }

    } catch (error: any) {
      var body = error.stack || JSON.stringify(error, null, 2);
      response = { statusCode: 500, body: body };
    }

    return response;
  }
}

export const handlerClass = new Lambda();
export const handler = handlerClass.handler;