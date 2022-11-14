/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsAsset } from "../../generated/assets";
import { CfnSpec } from "../../generated/cfnspec";
import { normalizeComparisonString } from "../../utils";
import { resolveResourceName } from "../resources/helpers";
import { resolveServiceName } from "../services/helpers";

/** Parsed CloudFormation resource type string parts */
export interface CfnResourceTypeParts {
  provider: string;
  serviceName: CfnSpec.ServiceName;
  resourceName: string;
}

/** Parse CloudFormation resource type string into parts */
export function parseCfnType(
  cfnType: CfnSpec.ResourceType
): CfnResourceTypeParts {
  return cfnType.match(
    /(?<provider>\w+)::(?<serviceName>\w+)::(?<resourceName>\w+)/
  )!.groups as any;
}

/** Definitaion of asset mappings to CloudFormation type */
interface CfnTypeAssets {
  readonly serviceName?: AwsAsset.Service;
  readonly resourceName?: AwsAsset.Resource;
  readonly generalIcon?: AwsAsset.GeneralIcon;
}

// VPC is nested in EC2 within CloudFormation but separate in other systems
const VpcAssetComparables: Record<string, string> = Object.fromEntries(
  Object.keys(AwsAsset.Resources).reduce((entries, key) => {
    if (key.startsWith("vpc_")) {
      entries.push([normalizeComparisonString(key.replace("vpc_", "")), key]);
    }
    return entries;
  }, [] as [string, string][])
);

/** Find asset type details for given CloudFormation type */
export function findCfnTypeAssets(
  cfnType: CfnSpec.ResourceType
): CfnTypeAssets {
  const cfn = parseCfnType(cfnType);

  let serviceName: AwsAsset.Service | undefined;
  let resourceName: AwsAsset.Resource | undefined;

  // handle edge cases (eg: EC2::VPCxxx is vpc:xxx in assets)
  if (cfn.serviceName === "EC2") {
    if (cfn.resourceName.startsWith("VPC")) {
      serviceName = "vpc";
      cfn.resourceName = cfn.resourceName.replace(/^VPC/, "");
    } else if (
      normalizeComparisonString(cfn.resourceName) in VpcAssetComparables
    ) {
      serviceName = "vpc";
      cfn.resourceName = normalizeComparisonString(cfn.resourceName);
    }
  }

  if (serviceName == null) {
    try {
      serviceName = resolveServiceName(cfn.serviceName);
    } catch (e) {
      console.warn((e as Error).message, cfnType);
    }
  }

  if (resourceName == null) {
    // There are lots of low-level cfn resource definitions without mappings to other systems,
    // for this reason we just ignore unresolved resources without spamming the console or
    // bubbling the error as this is expected in large percent of cases.
    try {
      resourceName = resolveResourceName(cfn.resourceName, serviceName);
    } catch {}
  }

  const generalIcon = resolveGeneralIcon(cfn.resourceName);

  return {
    serviceName,
    resourceName,
    generalIcon,
  };
}

/** Resolve general icon for a given value.  */
function resolveGeneralIcon(value: string): AwsAsset.GeneralIcon | undefined {
  value = normalizeComparisonString(value);

  if (value.match(/(configuration|config|setting)$/i)) {
    return "config";
  }
  if (value.match(/^(client)?(certificate)$/i)) {
    return "ssl_padlock";
  }
  if (value.match(/(profile|user)$/i)) {
    return "user";
  }
  if (value.match(/(policy|permissions?)$/i)) {
    return "policy";
  }
  if (value.match(/(key)$/i)) {
    return "key";
  }
  if (value.match(/(role)$/i)) {
    return "role";
  }
  if (value.match(/(server)$/i)) {
    return "traditional_server";
  }
  if (value.match(/(database)$/i)) {
    return "generic_database";
  }
  if (value.match(/(log)s?$/i)) {
    return "logs";
  }
  if (value.match(/(alarm|alert)s?$/i)) {
    return "alarm";
  }
  if (value.match(/(event)s?$/i)) {
    return "event";
  }
  if (value.match(/(rule)s?$/i)) {
    return "rule";
  }
  if (value.match(/(branch)$/i)) {
    return "git_repository";
  }
  if (value.match(/^(app|application)$/i)) {
    return "generic_application";
  }
  if (value.match(/^(documentation)/i)) {
    return "document";
  }
  if (value.match(/^(model)$/i)) {
    return "document";
  }
  if (value.match(/(template)/i)) {
    return "template";
  }
  if (value.match(/(attachment)$/i)) {
    return "attachment";
  }

  return undefined;
}
