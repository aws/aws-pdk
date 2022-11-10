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
import { CfnResource } from "aws-cdk-lib";
import { NagPack, NagMessageLevel, NagPackProps, rules } from "cdk-nag";
import { IConstruct } from "constructs";

export class AwsPrototypingChecks extends NagPack {
  constructor(props?: NagPackProps) {
    super(props);
    this.packName = "AwsPrototyping";
  }
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      this.checkStorage(node);
      this.checkNetworkDelivery(node);
    }
  }

  /**
   * Check Storage Services
   * @param node the CfnResource to check
   * @param ignores list of ignores for the resource
   */
  private checkStorage(node: CfnResource): void {
    this.applyRule({
      info: "The S3 bucket does not prohibit public access through bucket level settings.\n\nExample threat: A global internet based actor who has discovered a S3 bucket configured for public read or write can read or write data to or from the S3 bucket, which may lead to  possibily impacting the confidentiality, integrity and availability of the data assets hosted on the S3 bucket for the prototype",
      explanation:
        "Keep sensitive data safe from unauthorized remote users by preventing public access at the bucket level.",
      level: NagMessageLevel.ERROR,
      rule: rules.s3.S3BucketLevelPublicAccessProhibited,
      node: node,
    });
    this.applyRule({
      info: "The S3 Bucket does not have object lock enabled.",
      explanation:
        "Because sensitive data can exist at rest in S3 buckets, enforce object locks at rest to help protect that data.",
      level: NagMessageLevel.WARN,
      rule: rules.s3.S3BucketDefaultLockEnabled,
      node: node,
    });
  }

  /**
   * Check Network and Delivery Services
   * @param node the CfnResource to check
   * @param ignores list of ignores for the resource
   */
  private checkNetworkDelivery(node: CfnResource): void {
    this.applyRule({
      info: "The Lambda Function URL allows for public, unauthenticated access.\n\nExample threat: A global internet based actor who has discovered the Lambda Function URL can invoke the Lambda function without any authentication, which leads to reconnaissance and intrustion activities being performed against the exposed attack surface impacting the confidentiality, integrity and availability of the data and resource assets associated with the prototype",
      explanation:
        "AWS Lambda Function URLs allow you to invoke your function via a HTTPS end-point, setting the authentication to NONE allows anyone on the internet to invoke your function.",
      level: NagMessageLevel.ERROR,
      rule: rules.lambda.LambdaFunctionUrlAuth,
      node: node,
    });
  }
}
