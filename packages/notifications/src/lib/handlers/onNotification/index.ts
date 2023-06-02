import { DynamoDBStreamEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Logger } from '@aws-lambda-powertools/logger';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { AttributeValue, DynamoDBClient, UpdateItemCommand, UpdateItemCommandOutput, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { QueryCommand, DynamoDBDocumentClient, QueryCommandOutput } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const logger = new Logger({ serviceName: 'notificationService', logLevel: 'DEBUG' });
const tracer = new Tracer({ serviceName: 'notificationService' });
const metrics = new Metrics({ serviceName: 'notificationService', namespace: 'notificationService' });
const ddb = tracer.captureAWSv3Client(DynamoDBDocumentClient.from(new DynamoDBClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION })));

export enum NotificationLevels {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface NewNotification {
  notificationId: string;
  userId: string;
  level: NotificationLevels
  createdAt: number;
  createdBy: string;
  acknowlegedAt: number;
  acknowledged: boolean;
  dismissed: boolean;
  dismissedAt: number;
  message: string;
  sentAt: number;
  sent: boolean
}

const { WS_HTTPS_ENDPOINT, WS_API_STAGE, CONNECTIONS_TABLE_NAME, NOTIFICATIONS_TABLE_NAME } = process.env;

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler(event: DynamoDBStreamEvent, context: any): Promise<APIGatewayProxyResult> {

    // default response
    let response: APIGatewayProxyResult = { statusCode: 200, body: "" };

    // capture the API Gateway client
    const api = tracer.captureAWSv3Client(new ApiGatewayManagementApiClient({
      apiVersion: '2012-08-10',
      region: process.env.AWS_REGION,
      endpoint: `${WS_HTTPS_ENDPOINT}/${WS_API_STAGE}`,
    },
    ));

    // capture the context
    logger.addContext(context);

    // get user connections from the connections table
    const getUserConnections = async (props: { userId: string }): Promise<QueryCommandOutput> => {

      try {
        const queryCommand = new QueryCommand({
          TableName: CONNECTIONS_TABLE_NAME,
          IndexName: 'connectionsUserIndex',
          KeyConditionExpression: "#userId = :uid",
          ExpressionAttributeNames: {
            "#userId": "userId"
          },
          ExpressionAttributeValues: {
            ":uid": props.userId,
          }
        })
        //Query connection table to check for userId
        let connections = await ddb.send(queryCommand);

        return connections
      } catch (e: any) {
        logger.error(e);
        throw (e)
      }
    }

    // update a notification based on notificationId
    const updateNotification = async (props: { notifcation: NewNotification }): Promise<UpdateItemCommandOutput> => {
      const { notifcation } = props;

      const updateItemCommandInput: UpdateItemCommandInput = {
        TableName: NOTIFICATIONS_TABLE_NAME,
        Key: {
          "id": { S: notifcation.notificationId },
        },
        UpdateExpression: "set #sentAt = :sentAt, #sent = :sent",
        ExpressionAttributeNames: {
          "#sentAt": "sentAt",
          "#sent": "sent"
        },
        ExpressionAttributeValues: {
          ":sentAt": { N: `${Date.now()}` },
          ":sent": { BOOL: true }
        }
      }

      try {
        return await ddb.send(new UpdateItemCommand(updateItemCommandInput));
      } catch (e: any) {
        logger.error(e);
        throw (e);
      }
    }

    try {
      // loop through the records
      for (const record of event.Records) {
        // process if its a dynamo update and a newly created entry
        if (record.dynamodb && record.dynamodb.NewImage && record.eventName === 'INSERT') {
          // unmarshall the new image
          const newImage: NewNotification = unmarshall(record.dynamodb.NewImage as { [key: string]: AttributeValue }) as NewNotification;
          // get all the connections for the user specified
          const connections = await getUserConnections({ userId: newImage.userId });
          // send the message to all the connections
          for (const connection of connections!.Items!) {
            await api.send(new PostToConnectionCommand({
              ConnectionId: connection.connectionId, Data: Buffer.from(JSON.stringify({
                action: 'NEW_NOTIFICATION',
                notification: {...newImage},
              }))
            }));
            await updateNotification({ notifcation: newImage });
            metrics.addMetric('messageDelivered', MetricUnits.Count, 1);
          }
        }
      }
      // publish the metrics
      metrics.publishStoredMetrics();
    } catch (e: any) {
      // log errors and prepare the response
      logger.error(e);
      response = { statusCode: 500, body: e.stack };
    }
    return response;
  }
}

export const handlerClass = new Lambda();
export const handler = handlerClass.handler;