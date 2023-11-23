/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/* eslint-disable import/no-extraneous-dependencies */
import {
  GetKeyPolicyCommand,
  KMSClient,
  PutKeyPolicyCommand,
} from "@aws-sdk/client-kms";
import {
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse,
  Context,
} from "aws-lambda";

const s3Client = new S3Client({
  region: process.env.REGION,
});
const kmsClient = new KMSClient({
  region: process.env.REGION,
});

export const handler = async (
  event: CdkCustomResourceEvent,
  ctx: Context
): Promise<CdkCustomResourceResponse> => {
  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: ctx.logGroupName,
  };

  switch (event.RequestType) {
    case "Create":
      await updateBucketPolicy(event);
      return {
        ...response,
        Status: "Success",
        Data: { Result: "Updated Bucket Policy" },
      };
    default:
      return { ...response, Status: "Success", Data: { Result: "No-op" } };
  }
};

const updateBucketPolicy = async (event: CdkCustomResourceEvent) => {
  const { KEY_ID, BUCKET_NAME, DISTRIBUTION_ARN, BUCKET_RESOURCES } =
    event.ResourceProperties;
  const bucketPolicy = await s3Client.send(
    new GetBucketPolicyCommand({
      Bucket: BUCKET_NAME,
    })
  );

  if (bucketPolicy.Policy) {
    const policy = JSON.parse(bucketPolicy.Policy);
    (policy.Statement as Array<any>).push({
      Effect: "ALLOW",
      Action: ["s3:GetObject"],
      Principal: {
        Service: "cloudfront.amazonaws.com",
      },
      Resource: [BUCKET_RESOURCES],
      Condition: {
        ArnEquals: {
          "AWS:SourceArn": DISTRIBUTION_ARN,
        },
      },
    });
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(policy),
      })
    );
  }

  if (KEY_ID) {
    const keyPolicy = await kmsClient.send(
      new GetKeyPolicyCommand({
        KeyId: KEY_ID,
        PolicyName: "default",
      })
    );
    if (keyPolicy.Policy) {
      const policy = JSON.parse(keyPolicy.Policy);
      (policy.Statement as Array<any>).push({
        Effect: "ALLOW",
        Action: ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey*"],
        Principal: {
          Service: "cloudfront.amazonaws.com",
        },
        Resource: ["*"],
        Condition: {
          ArnEquals: {
            "AWS:SourceArn": DISTRIBUTION_ARN,
          },
        },
      });
      await kmsClient.send(
        new PutKeyPolicyCommand({
          KeyId: KEY_ID,
          PolicyName: "default",
          Policy: JSON.stringify(policy),
        })
      );
    }
  }
};
