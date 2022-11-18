<!-- Auto-generated file - do not modify. -->

<!--
    Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
    SPDX-License-Identifier: Apache-2.0
    -->

# AwsPrototyping

<Placeholder>


## Errors

Total: `2`

| Rule ID | Cause | Explanation |
| ------------------ | ------------------ | ------------------ |
| S3BucketLevelPublicAccessProhibited | The S3 bucket does not prohibit public access through bucket level settings. | Keep sensitive data safe from unauthorized remote users by preventing public access at the bucket level. |
| LambdaFunctionUrlAuth | The Lambda Function URL allows for public, unauthenticated access. | AWS Lambda Function URLs allow you to invoke your function via a HTTPS end-point, setting the authentication to NONE allows anyone on the internet to invoke your function. |

## Warnings

Total: `1`

| Rule ID | Cause | Explanation |
| ------------------ | ------------------ | ------------------ |
| S3BucketDefaultLockEnabled | The S3 Bucket does not have object lock enabled. | Because sensitive data can exist at rest in S3 buckets, enforce object locks at rest to help protect that data. |
