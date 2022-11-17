/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NagMessageLevel, rules } from "cdk-nag";

export let PackName = "AwsPrototyping";

export let RuleMetadata = [
  {
    info: "The S3 bucket does not prohibit public access through bucket level settings.",
    explanation:
      "Keep sensitive data safe from unauthorized remote users by preventing public access at the bucket level.",
    level: NagMessageLevel.ERROR,
    rule: rules.s3.S3BucketLevelPublicAccessProhibited,
  },
  {
    info: "The S3 Bucket does not have object lock enabled.",
    explanation:
      "Because sensitive data can exist at rest in S3 buckets, enforce object locks at rest to help protect that data.",
    level: NagMessageLevel.WARN,
    rule: rules.s3.S3BucketDefaultLockEnabled,
  },
  {
    info: "The Lambda Function URL allows for public, unauthenticated access.",
    explanation:
      "AWS Lambda Function URLs allow you to invoke your function via a HTTPS end-point, setting the authentication to NONE allows anyone on the internet to invoke your function.",
    level: NagMessageLevel.ERROR,
    rule: rules.lambda.LambdaFunctionUrlAuth,
  },
];
