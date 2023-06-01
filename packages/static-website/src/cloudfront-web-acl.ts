/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { CustomResource, Duration, Stack } from "aws-cdk-lib";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Provider } from "aws-cdk-lib/custom-resources";
import { NagSuppressions } from "cdk-nag";
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
  readonly cidrType: CidrType;

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

  /**
   * Set to true to prevent creation of a web acl for the static website
   * @default false
   */
  readonly disable?: boolean;
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

    const stack = Stack.of(this);
    const aclName = `${stack.stackName}-${id}`; // Unique per stack
    const onEventHandler = this.createOnEventHandler(stack, aclName);
    const customResource = this.createAclCustomResource(
      stack,
      aclName,
      onEventHandler,
      props
    );

    this.webAclId = customResource.getAttString("WebAclId");
    this.webAclArn = customResource.getAttString("WebAclArn");
  }

  /**
   * Creates an event handler for managing an ACL in us-east-1.
   *
   * @param stack containing Stack instance.
   * @param aclName name of the ACL to manage.
   * @private
   */
  private createOnEventHandler(stack: Stack, aclName: string): Function {
    const onEventHandlerName = `${PDKNag.getStackPrefix(stack)
      .split("/")
      .join("-")}OnEventHandler`;
    const onEventHandlerRole = new Role(this, "OnEventHandlerRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        logs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: [
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${onEventHandlerName}`,
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${onEventHandlerName}:*`,
              ],
            }),
          ],
        }),
        wafv2: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "wafv2:CreateWebACL",
                "wafv2:DeleteWebACL",
                "wafv2:UpdateWebACL",
                "wafv2:GetWebACL",
              ],
              resources: [
                `arn:aws:wafv2:us-east-1:${stack.account}:global/ipset/${aclName}-IPSet/*`,
                `arn:aws:wafv2:us-east-1:${stack.account}:global/webacl/${aclName}/*`,
                `arn:aws:wafv2:us-east-1:${stack.account}:global/managedruleset/*/*`,
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "wafv2:CreateIPSet",
                "wafv2:DeleteIPSet",
                "wafv2:UpdateIPSet",
                "wafv2:GetIPSet",
              ],
              resources: [
                `arn:aws:wafv2:us-east-1:${stack.account}:global/ipset/${aclName}-IPSet/*`,
              ],
            }),
          ],
        }),
      },
    });

    const onEventHandler = new Function(
      this,
      "CloudfrontWebAclOnEventHandler",
      {
        code: Code.fromAsset(
          path.join(__dirname, "../lib/webacl_event_handler")
        ),
        role: onEventHandlerRole,
        functionName: onEventHandlerName,
        handler: "index.onEvent",
        runtime: Runtime.NODEJS_16_X,
        timeout: Duration.seconds(300),
      }
    );

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          onEventHandlerRole,
          [
            {
              id: RuleId,
              reason:
                "WafV2 resources have been scoped down to the ACL/IPSet level, however * is still needed as resource id's are created just in time.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:aws:wafv2:us-east-1:${PDKNag.getStackAccountRegex(
                    stack
                  )}:global/(.*)$/g`,
                },
              ],
            },
            {
              id: RuleId,
              reason:
                "Cloudwatch resources have been scoped down to the LogGroup level, however * is still needed as stream names are created just in time.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:aws:logs:${PDKNag.getStackRegionRegex(
                    stack
                  )}:${PDKNag.getStackAccountRegex(
                    stack
                  )}:log-group:/aws/lambda/${onEventHandlerName}:\*/g`,
                },
              ],
            },
          ],
          true
        );
      }
    );

    return onEventHandler;
  }

  /**
   * Creates a Custom resource to manage the deployment of the ACL.
   *
   * @param stack containing Stack instance.
   * @param aclName name of the ACL to manage.
   * @param onEventHandler event handler to use for deployment.
   * @param props user provided properties for configuring the ACL.
   * @private
   */
  private createAclCustomResource(
    stack: Stack,
    aclName: string,
    onEventHandler: Function,
    props?: CloudFrontWebAclProps
  ): CustomResource {
    const providerFunctionName = `${onEventHandler.functionName}-Provider`;
    const providerRole = new Role(this, "CloudfrontWebAclProviderRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        logs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: [
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${providerFunctionName}`,
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${providerFunctionName}:*`,
              ],
            }),
          ],
        }),
      },
    });
    const provider = new Provider(this, "CloudfrontWebAclProvider", {
      onEventHandler,
      role: providerRole,
      providerFunctionName,
    });

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          providerRole,
          [
            {
              id: RuleId,
              reason:
                "Cloudwatch resources have been scoped down to the LogGroup level, however * is still needed as stream names are created just in time.",
            },
          ],
          true
        );
      }
    );

    ["AwsSolutions-L1", "AwsPrototyping-LambdaLatestVersion"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          provider,
          [
            {
              id: RuleId,
              reason:
                "Latest runtime cannot be configured. CDK will need to upgrade the Provider construct accordingly.",
            },
          ],
          true
        );
      }
    );

    return new CustomResource(this, "CFWebAclCustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        ID: aclName,
        MANAGED_RULES: props?.managedRules ?? [
          { vendor: "AWS", name: "AWSManagedRulesCommonRuleSet" },
        ],
        CIDR_ALLOW_LIST: props?.cidrAllowList,
      },
    });
  }
}
