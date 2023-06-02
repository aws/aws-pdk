/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { RemovalPolicy } from "aws-cdk-lib";
import * as DynamoDB from "aws-cdk-lib/aws-dynamodb";
import * as Kms from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";

export interface SetupDdbTableProps {
  removalPolicy?: RemovalPolicy;
}

export const ddb = (construct: Construct, props?: SetupDdbTableProps) => {
  const removalPolicy = props?.removalPolicy
    ? props.removalPolicy
    : RemovalPolicy.DESTROY;

  // create a ddb table for connections
  const webSocketsConnectionsTable = new DynamoDB.Table(
    construct,
    "WebSocketsConnections",
    {
      removalPolicy: removalPolicy,
      partitionKey: {
        name: "connectionId",
        type: DynamoDB.AttributeType.STRING,
      },
      sortKey: { name: "createdAt", type: DynamoDB.AttributeType.NUMBER },
      billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expireAt",
      encryption: DynamoDB.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: new Kms.Key(
        construct,
        "WebSocketsConnectionsTableEncryptionKey",
        {
          enableKeyRotation: true,
        }
      ),
    }
  );

  // create a global secondary index for userId
  webSocketsConnectionsTable.addGlobalSecondaryIndex({
    indexName: "connectionsUserIndex",
    partitionKey: { name: "userId", type: DynamoDB.AttributeType.STRING },
  });

  // create a ddb table for notifications
  const webSocketsNotificationsTable = new DynamoDB.Table(
    construct,
    "WebSocketsNotifications",
    {
      partitionKey: { name: "id", type: DynamoDB.AttributeType.STRING },
      billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
      stream: DynamoDB.StreamViewType.NEW_IMAGE,
      removalPolicy: removalPolicy,
      pointInTimeRecovery: true,
      encryption: DynamoDB.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: new Kms.Key(
        construct,
        "WebSocketsNotificationsTableEncryptionKey",
        {
          enableKeyRotation: true,
        }
      ),
    }
  );

  // create a global secondary index for userId
  webSocketsNotificationsTable.addGlobalSecondaryIndex({
    indexName: "notificationsUserIndex",
    partitionKey: { name: "userId", type: DynamoDB.AttributeType.STRING },
  });

  return {
    webSocketsConnectionsTable,
    webSocketsNotificationsTable,
  };
};
