/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { Stack } from "aws-cdk-lib";
import {
  CfnIPSet,
  CfnWebACL,
  CfnWebACLAssociation,
} from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";
import { OpenApiGatewayWebAclOptions } from "./types";

/**
 * Configuration for the Web ACL for the API
 */
export interface OpenApiGatewayWebAclProps extends OpenApiGatewayWebAclOptions {
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
      .join("-")}-${id}-WebAcl`;
    const ipSetName = `${aclName}-IPSet`;

    // Create the IP Set if requested
    this.ipSet = props.cidrAllowList
      ? new CfnIPSet(this, "IPSet", {
          name: ipSetName,
          addresses: props.cidrAllowList.cidrRanges,
          ipAddressVersion: props.cidrAllowList.cidrType,
          scope: "REGIONAL",
        })
      : undefined;

    const managedRules = props.managedRules ?? [
      { vendor: "AWS", name: "AWSManagedRulesCommonRuleSet" },
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
      ...managedRules.map(({ vendor, name }, i) => ({
        name: `${vendor}-${name}`,
        priority: i + 2,
        statement: { managedRuleGroupStatement: { vendorName: vendor, name } },
        overrideAction: { none: {} },
        visibilityConfig: {
          metricName: `${aclName}-${vendor}-${name}`,
          cloudWatchMetricsEnabled: true,
          sampledRequestsEnabled: true,
        },
      })),
    ];

    this.webAcl = new CfnWebACL(this, "WebACL", {
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
