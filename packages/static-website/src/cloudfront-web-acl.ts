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
import * as path from "path";
import { CustomResource, Duration } from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

/**
 * Represents a WAF V2 managed rule.
 */
export interface ManagedRule {
  /**
   * The name of the managed rule group vendor. You use this, along with the rule group name, to identify the rule group.
   */
  readonly vendor: string;

  /**
   * The name of the managed rule group. You use this, along with the vendor name, to identify the rule group.
   */
  readonly name: string;
}

/**
 * Type of Cidr.
 */
export type CidrType = "IPV4" | "IPV6";

/**
 * Representation of a CIDR range.
 */
export interface CidrAllowList {
  /**
   * Type of CIDR range.
   */
  readonly type: CidrType;

  /**
   * Specify an IPv4 address by using CIDR notation. For example:
   * To configure AWS WAF to allow, block, or count requests that originated from the IP address 192.0.2.44, specify 192.0.2.44/32 .
   * To configure AWS WAF to allow, block, or count requests that originated from IP addresses from 192.0.2.0 to 192.0.2.255, specify 192.0.2.0/24 .
   *
   * For more information about CIDR notation, see the Wikipedia entry Classless Inter-Domain Routing .
   *
   * Specify an IPv6 address by using CIDR notation. For example:
   * To configure AWS WAF to allow, block, or count requests that originated from the IP address 1111:0000:0000:0000:0000:0000:0000:0111, specify 1111:0000:0000:0000:0000:0000:0000:0111/128 .
   * To configure AWS WAF to allow, block, or count requests that originated from IP addresses 1111:0000:0000:0000:0000:0000:0000:0000 to 1111:0000:0000:0000:ffff:ffff:ffff:ffff, specify 1111:0000:0000:0000:0000:0000:0000:0000/64 .
   */
  readonly cidrRanges: string[];
}

/**
 * Properties to configure the web acl.
 */
export interface CloudFrontWebAclProps {
  /**
   * List of managed rules to apply to the web acl.
   *
   * @default - [{ vendor: "AWS", name: "AWSManagedRulesCommonRuleSet" }]
   */
  readonly managedRules?: ManagedRule[];

  /**
   * List of cidr ranges to allow.
   *
   * @default - undefined
   */
  readonly cidrAllowList?: CidrAllowList;
}

/**
 * This construct creates a WAFv2 Web ACL for cloudfront in the us-east-1 region (required for cloudfront) no matter the
 * region of the parent cdk stack.
 */
export class CloudfrontWebAcl extends Construct {
  public readonly webAclId: string;
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props?: CloudFrontWebAclProps) {
    super(scope, id);

    const onEventHandler = new NodejsFunction(
      this,
      "CloudfrontWebAclOnEventHandler",
      {
        entry: path.join(__dirname, "webacl-event-handler/index.ts"),
        functionName: "CloudfrontWebAclCustomResource",
        handler: "onEvent",
        runtime: Runtime.NODEJS_16_X,
        timeout: Duration.seconds(300),
        bundling: {
          externalModules: ["aws-sdk"],
        },
      }
    );

    onEventHandler.role!.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "wafv2:CreateWebACL",
          "wafv2:DeleteWebACL",
          "wafv2:UpdateWebACL",
          "wafv2:GetWebACL",
          "wafv2:CreateIPSet",
          "wafv2:DeleteIPSet",
          "wafv2:UpdateIPSet",
          "wafv2:GetIPSet",
        ],
        resources: ["*"],
      })
    );

    const provider = new Provider(this, "CloudfrontWebAclProvider", {
      onEventHandler,
    });

    const customResource = new CustomResource(this, "CFWebAclCustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        ID: id,
        MANAGED_RULES: props?.managedRules ?? [
          { vendor: "AWS", name: "AWSManagedRulesCommonRuleSet" },
        ],
        CIDR_ALLOW_LIST: props?.cidrAllowList,
      },
    });

    this.webAclId = customResource.getAttString("WebAclId");
    this.webAclArn = customResource.getAttString("WebAclArn");
  }
}
