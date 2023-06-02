/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { join } from "path";
import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2-alpha";
import { WebSocketLambdaAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Stack } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { ddb, sqs } from "./construct";
import { functionProps } from "./handlers/lambdaDefaults";

/**
 * Properties which configure the Notifications.
 */
export interface NotificationServiceProps {
  /**
   * User provided Cognito UserPool id
   */
  readonly cognitoUserPoolId: string;
  /**
   * User provided Cognito Web Client id
   */
  readonly cognitoWebClientId: string;
  /**
   * User provided logging level
   */
  readonly logLevel: string;
}

/**
 * Creates a Notification with associated support infrastructure (SQS, DDB, WebSocket API, etc.)
 *
 * @export
 * @class Notifications
 * @extends {Construct}
 * @example
 * new Notifications(this, 'Notifications', props);
 */
export class Notifications extends Construct {
  public webSocketsConnectionsTable: Table;
  public webSocketsNotificationsTable: Table;
  public webSocketApi: WebSocketApi;

  /**
   * Creates an instance of Notifications.
   * @param {Stack} scope
   * @param {string} id
   * @param {NotificationServiceProps} props
   * @memberof Notifications
   */
  constructor(scope: Stack, id: string, props: NotificationServiceProps) {
    super(scope, id);

    const { cognitoUserPoolId, cognitoWebClientId } = props;

    const { webSocketsConnectionsTable, webSocketsNotificationsTable } =
      ddb(this);
    this.webSocketsConnectionsTable = webSocketsConnectionsTable;
    this.webSocketsNotificationsTable = webSocketsNotificationsTable;

    const notifcationQueue = sqs(this);

    const nodeJsFunctionProps = functionProps({
      connectionTableName: this.webSocketsConnectionsTable.tableName,
      notificationsTableName: this.webSocketsNotificationsTable.tableName,
      cognitoUserPoolId: cognitoUserPoolId,
      cognitoWebClientId: cognitoWebClientId,
    });

    /**
     * A Lambda for WebSocketLambdaAuthorizer.
     *
     * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-lambda-auth.html
     */
    const authorizerHandler = new NodejsFunction(this, "AuthorizerHandler", {
      entry: join(__dirname, "/../src/handlers/authorizer/index.ts"),
      ...nodeJsFunctionProps,
    });

    /**
     * A Lambda authorizer to control access to the API.
     *
     * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-lambda-auth.html
     */
    const authorizer = new WebSocketLambdaAuthorizer(
      "Authorizer",
      authorizerHandler,
      {
        identitySource: ["route.request.querystring.token"],
      }
    );

    // connect handler
    const onConnectHandler = new NodejsFunction(this, "OnConnectHandler", {
      entry: join(__dirname, "/../src/handlers/onConnect/index.ts"),
      ...nodeJsFunctionProps,
      environment: {
        ...nodeJsFunctionProps.environment,
        NOTIFICATION_QUEUE_URL: notifcationQueue.queue.queueUrl,
      },
    });
    this.webSocketsConnectionsTable.grantWriteData(onConnectHandler);
    this.webSocketsNotificationsTable.grantReadData(onConnectHandler);
    notifcationQueue.queue.grantSendMessages(onConnectHandler);

    // disconnect handler
    const onDisconnectHandler = new NodejsFunction(
      this,
      "OnDisconnectHandler",
      {
        entry: join(__dirname, "/../src/lib/handlers/onDisconnect/index.ts"),
        ...nodeJsFunctionProps,
      }
    );
    this.webSocketsConnectionsTable.grantReadWriteData(onDisconnectHandler);

    // message handler
    const onMessageHandler = new NodejsFunction(this, "OnMessageHandler", {
      entry: join(__dirname, "/../src/lib/handlers/onMessage/index.ts"),
      ...nodeJsFunctionProps,
    });
    this.webSocketsConnectionsTable.grantReadData(onMessageHandler);
    this.webSocketsNotificationsTable.grantReadWriteData(onMessageHandler);

    // notification handler
    const onNotificationHandler = new NodejsFunction(
      this,
      "OnNotificationHandler",
      {
        entry: join(__dirname, "/../src/lib/handlers/onNotification/index.ts"),
        ...nodeJsFunctionProps,
      }
    );
    // allow handler to read and write to the connections table
    this.webSocketsConnectionsTable.grantReadData(onNotificationHandler);
    this.webSocketsNotificationsTable.grantReadWriteData(onNotificationHandler);

    // notification processor queue handler
    const processNotificationQueueHandler = new NodejsFunction(
      this,
      "ProcessNotificationQueueHandler",
      {
        entry: join(
          __dirname,
          "/../src/lib/handlers/processNotificationQueue/index.ts"
        ),
        ...nodeJsFunctionProps,
      }
    );

    notifcationQueue.queue.grantConsumeMessages(
      processNotificationQueueHandler
    );
    this.webSocketsConnectionsTable.grantReadData(
      processNotificationQueueHandler
    );
    this.webSocketsNotificationsTable.grantReadWriteData(
      processNotificationQueueHandler
    );

    // add event source to notifcationQueue
    processNotificationQueueHandler.addEventSource(
      new SqsEventSource(notifcationQueue.queue, {
        batchSize: 1,
      })
    );

    // websocket api
    this.webSocketApi = new WebSocketApi(this, "WebsocketApi", {
      description: "Websocket API",
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ConnectIntegration",
          onConnectHandler
        ),
        authorizer,
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DisconnectIntegration",
          onDisconnectHandler
        ),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "DefaultIntegration",
          onMessageHandler
        ),
      },
    });

    const stage = new WebSocketStage(this, "Prod", {
      webSocketApi: this.webSocketApi,
      stageName: "wss",
      autoDeploy: true,
    });

    // grant management access
    [
      onNotificationHandler,
      processNotificationQueueHandler,
      onMessageHandler,
    ].forEach((handler: NodejsFunction) => {
      this.webSocketApi.grantManageConnections(handler);
      stage.grantManagementApiAccess(handler);
      handler.addEnvironment("WS_API_ENDPOINT", this.webSocketApi.apiEndpoint);
      handler.addEnvironment(
        "WS_HTTPS_ENDPOINT",
        `https://${this.webSocketApi.apiId}.execute-api.${stage.stack.region}.amazonaws.com`
      );
      handler.addEnvironment("WS_API_STAGE", stage.stageName);
    });
  }
}
