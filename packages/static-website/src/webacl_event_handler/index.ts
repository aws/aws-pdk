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

 // eslint-disable-line

import { Rule, WAFV2 } from "@aws-sdk/client-wafv2";

const DELIMITER = ":";
const SCOPE = "CLOUDFRONT";
const client = new WAFV2({
  region: "us-east-1"
});

/**
 * Handler for creating a WAF V2 ACL in US-EAST-1.
 */
exports.onEvent = async (event: any) => {
  const { ID, MANAGED_RULES, CIDR_ALLOW_LIST } = event.ResourceProperties;
  const [WEB_ACL_ID, IP_SET_ID] = event.PhysicalResourceId
    ? event.PhysicalResourceId.split(DELIMITER)
    : [];
  let response = {};

  switch (event.RequestType) {
    case "Create":
      response = await createWaf(ID, MANAGED_RULES, CIDR_ALLOW_LIST);
      break;
    case "Update":
      response = await updateWaf(
        WEB_ACL_ID,
        IP_SET_ID,
        ID,
        getIpSetName(ID),
        MANAGED_RULES,
        CIDR_ALLOW_LIST
      );
      break;
    case "Delete":
      response = await deleteWaf(WEB_ACL_ID, IP_SET_ID, ID, getIpSetName(ID));
      break;
    default:
      throw new Error(`Invalid RequestType: ${event.RequestType}`);
  }

  return response;
};

/**
 * Generates the name of the IP Set.
 *
 * @param id param passed in.
 * @returns name of IP Set.
 */
const getIpSetName = (id: string) => `${id}-IPSet`;

/**
 * Returns a set of rules to apply.
 *
 * @param ipSetArn ip set arn
 * @param ipSetName  ip set name
 * @param managedRules  managed rules
 * @param cidrAllowList cidr allow list
 * @returns set of rules to apply.
 */
const getWafRules = (
  ipSetArn: string,
  ipSetName: string,
  managedRules?: any,
  cidrAllowList?: any
): Array<Rule> => {
  const rules: Array<Rule> = [];

  if (cidrAllowList) {
    rules.push({
      Name: ipSetName,
      Priority: 1,
      VisibilityConfig: {
        MetricName: ipSetName,
        CloudWatchMetricsEnabled: true,
        SampledRequestsEnabled: true,
      },
      Action: {
        Block: {},
      },
      Statement: {
        NotStatement: {
          Statement: {
            IPSetReferenceStatement: {
              ARN: ipSetArn,
            },
          },
        },
      },
    });
  }

  if (managedRules) {
    rules.push(
      ...managedRules
        .map((r: any) => ({ VendorName: r.vendor, Name: r.name }))
        .map((rule: any, Priority: any) => ({
          Name: `${rule.VendorName}-${rule.Name}`,
          Priority,
          Statement: { ManagedRuleGroupStatement: rule },
          OverrideAction: { None: {} },
          VisibilityConfig: {
            MetricName: `${rule.VendorName}-${rule.Name}`,
            CloudWatchMetricsEnabled: true,
            SampledRequestsEnabled: true,
          },
        }))
    );
  }

  return rules;
};

const createWaf = async (
  id: string,
  managedRules?: any,
  cidrAllowList?: any
) => {
  const ipSetName = getIpSetName(id);
  const createIpSetResponse = await client
    .createIPSet({
      Name: ipSetName,
      Scope: SCOPE,
      Addresses: cidrAllowList?.cidrRanges ?? [],
      IPAddressVersion: cidrAllowList?.cidrType ?? "IPV4",
    });

  const createWebAclResponse = await client
    .createWebACL({
      Name: id,
      DefaultAction: { Allow: {} },
      Scope: SCOPE,
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        MetricName: id,
        SampledRequestsEnabled: true,
      },
      Rules: getWafRules(
        createIpSetResponse.Summary!.ARN!,
        ipSetName,
        managedRules,
        cidrAllowList
      ),
    });

  return {
    PhysicalResourceId: `${createWebAclResponse.Summary?.Id}${DELIMITER}${createIpSetResponse.Summary?.Id}`,
    Data: {
      WebAclArn: createWebAclResponse.Summary?.ARN,
      WebAclId: createWebAclResponse.Summary?.Id,
      IPSetArn: createIpSetResponse.Summary?.ARN,
      IPSetId: createIpSetResponse.Summary?.Id,
    },
  };
};

const updateWaf = async (
  webAclId: string,
  ipSetId: string,
  id: string,
  ipSetName: string,
  managedRules?: any,
  cidrAllowList?: any
) => {
  const getIpSetResponse = await client
    .getIPSet({
      Id: ipSetId,
      Name: ipSetName,
      Scope: SCOPE,
    });

  await client
    .updateIPSet({
      Id: ipSetId,
      Name: ipSetName,
      Addresses: cidrAllowList?.cidrRanges ?? [],
      Scope: SCOPE,
      LockToken: getIpSetResponse.LockToken!,
    });

  const getWebAclResponse = await client
    .getWebACL({
      Id: webAclId,
      Name: id,
      Scope: SCOPE,
    });

  await client
    .updateWebACL({
      Name: id,
      DefaultAction: { Allow: {} },
      Scope: SCOPE,
      VisibilityConfig: {
        CloudWatchMetricsEnabled: true,
        MetricName: id,
        SampledRequestsEnabled: true,
      },
      Rules: getWafRules(
        getIpSetResponse.IPSet?.ARN!,
        ipSetName,
        managedRules,
        cidrAllowList
      ),
      Id: getWebAclResponse.WebACL?.Id!,
      LockToken: getWebAclResponse.LockToken!,
    });

  return {
    Data: {
      WebAclArn: getWebAclResponse.WebACL?.ARN,
      WebAclId: getWebAclResponse.WebACL?.Id,
      IPSetArn: getIpSetResponse.IPSet?.ARN,
      IPSetId: getIpSetResponse.IPSet?.Id,
    },
  };
};

const deleteWaf = async (
  webAclId: string,
  ipSetId: string,
  id: string,
  ipSetName: string
) => {
  const getWebAclResponse = await client
    .getWebACL({
      Id: webAclId,
      Name: id,
      Scope: SCOPE,
    });

  await client
    .deleteWebACL({
      Id: webAclId,
      Name: id,
      Scope: SCOPE,
      LockToken: getWebAclResponse.LockToken!,
    });

  const getIpSetResponse = await client
    .getIPSet({
      Id: ipSetId,
      Name: ipSetName,
      Scope: SCOPE,
    });

  await client
    .deleteIPSet({
      Id: ipSetId,
      Name: ipSetName,
      Scope: SCOPE,
      LockToken: getIpSetResponse.LockToken!,
    });

  return {
    Data: {
      WebAclArn: getWebAclResponse.WebACL?.ARN,
      WebAclId: getWebAclResponse.WebACL?.Id,
      IPSetArn: getIpSetResponse.IPSet?.ARN,
      IPSetId: getIpSetResponse.IPSet?.Id,
    },
  };
};
