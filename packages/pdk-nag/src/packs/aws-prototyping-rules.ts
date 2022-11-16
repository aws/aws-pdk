/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
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
