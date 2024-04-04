/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from "@aws/pdk-nag";
import { Stack } from "aws-cdk-lib";
import {
  CfnIPSet,
  CfnWebACL,
  CfnWebACLAssociation,
} from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";
import { TypeSafeApiWebAclOptions } from "./types";

/**
 * Configuration for the Web ACL for the API
 */
export interface OpenApiGatewayWebAclProps extends TypeSafeApiWebAclOptions {
  /**
   * The arn of the deployment stage of the API with which the Web ACL will be associated
   */
  readonly apiDeploymentStageArn: string;
}

/**
 * Associate an AWS WAF v2 Web ACL with the given api
 */
export class OpenApiGatewayWebAcl extends Construct {
  readonly webAcl?: CfnWebACL;
  readonly ipSet?: CfnIPSet;
  readonly webAclAssociation?: CfnWebACLAssociation;

  constructor(scope: Construct, id: string, props: OpenApiGatewayWebAclProps) {
    super(scope, id);

    const aclName = `${PDKNag.getStackPrefix(Stack.of(this))
      .split("/")
      .join("-")}${id}-${this.node.addr.slice(-8)}`;
    const ipSetName = `${aclName}-IPSet`;

    // Create the IP Set if requested
    this.ipSet = props.cidrAllowList
      ? new CfnIPSet(this, "ApiIPSet", {
          name: ipSetName,
          addresses: props.cidrAllowList.cidrRanges,
          ipAddressVersion: props.cidrAllowList.cidrType,
          scope: "REGIONAL",
        })
      : undefined;

    // TODO: vendor property is deprecated, to be removed in the future iterations
    // and vendorName will be required
    const anyMissingVendor = props.managedRules?.some(
      (q) => !q.vendorName && !q.vendor
    );

    if (anyMissingVendor) {
      throw new Error(
        "The provided managed rules need to define either the vendor or vendorName (preferred) property"
      );
    }

    const managedRules = props.managedRules ?? [
      { vendorName: "AWS", name: "AWSManagedRulesCommonRuleSet" },
    ];

    const rules: CfnWebACL.RuleProperty[] = [
      // Add a rule for the IP Set if specified
      ...(this.ipSet
        ? [
            {
              name: ipSetName,
              priority: 1,
              visibilityConfig: {
                metricName: ipSetName,
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
              },
              action: {
                block: {},
              },
              statement: {
                notStatement: {
                  statement: {
                    ipSetReferenceStatement: {
                      arn: this.ipSet.attrArn,
                    },
                  },
                },
              },
            },
          ]
        : []),
      // Add the managed rules
      ...managedRules.map(
        (
          { vendor, vendorName, name, ...others },
          i
        ): CfnWebACL.RuleProperty => {
          // TODO: the usage of `vendor` it's for backward compatibility
          // it will be removed in the next PDK versions
          const vendorNameToUser = (vendor || vendorName)!;

          return {
            name: `${vendorNameToUser}-${name}`,
            priority: i + 2,
            statement: {
              managedRuleGroupStatement: {
                ...others,
                vendorName: vendorNameToUser,
                name,
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              metricName: `${aclName}-${vendorNameToUser}-${name}`,
              cloudWatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
            },
          };
        }
      ),
    ];

    this.webAcl = new CfnWebACL(this, "ApiWebACL", {
      name: aclName,
      defaultAction: {
        // Allow by default, and use rules to deny unwanted requests
        allow: {},
      },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: aclName,
      },
      rules,
    });

    this.webAclAssociation = new CfnWebACLAssociation(
      this,
      "WebACLAssociation",
      {
        resourceArn: props.apiDeploymentStageArn,
        webAclArn: this.webAcl.attrArn,
      }
    );
  }
}
