/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
 * Configuration for the Web ACL associated with the API
 */
export interface OpenApiGatewayWebAclOptions {
  /**
   * If set to true, no WebACL will be associated with the API. You can also use this option if you would like to create
   * your own WebACL and associate it yourself.
   * @default false
   */
  readonly disable?: boolean;

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
