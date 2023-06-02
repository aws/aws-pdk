/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { RemovalPolicy } from "aws-cdk-lib";
import * as Kms from "aws-cdk-lib/aws-kms";
import * as SQS from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export interface SetupSqsProps {
  removalPolicy?: RemovalPolicy;
}

export interface SetupSqsOutput {
  queue: SQS.Queue;
}

export const sqs = (
  construct: Construct,
  props?: SetupSqsProps
): SetupSqsOutput => {
  const removalPolicy = props?.removalPolicy
    ? props.removalPolicy
    : RemovalPolicy.DESTROY;

  const queue = new SQS.Queue(construct, "Queue", {
    removalPolicy: removalPolicy,
    contentBasedDeduplication: true,
    encryption: SQS.QueueEncryption.KMS_MANAGED,
    encryptionMasterKey: new Kms.Key(
      construct,
      "WebSocketsQueueEncryptionKey",
      {
        enableKeyRotation: true,
      }
    ),
  });

  return { queue };
};
