/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NORMALIZED_SERVICE_VARIANTS } from "./variants";
import { AwsAsset } from "../../generated/assets";
import { normalizeComparisonString, normalizeIdentifier } from "../../utils";

/** @internal */
const SERVICE_NAME_LOOKUP: { [key: string]: string } = Object.fromEntries([
  ...Object.keys(AwsAsset.Services).flatMap((key) => {
    return [
      // constant self lookup
      [key, key],
      [normalizeComparisonString(key), key],
    ];
  }),
  ...Object.entries(NORMALIZED_SERVICE_VARIANTS).flatMap(([key, variants]) => {
    if (variants == null) return [];
    return variants.map((variant) => [normalizeComparisonString(variant), key]);
  }),
]);

/** @internal */
export function resolveServiceName(value: string): AwsAsset.Service {
  const comparableValue = normalizeComparisonString(value);

  // constant lookup first for perf
  if (comparableValue in SERVICE_NAME_LOOKUP) {
    return SERVICE_NAME_LOOKUP[comparableValue] as AwsAsset.Service;
  }

  // attempt know mappings
  if (
    comparableValue.startsWith("media") &&
    SERVICE_NAME_LOOKUP[`elemental${comparableValue}`]
  ) {
    const serviceName = SERVICE_NAME_LOOKUP[`elemental${comparableValue}`];
    SERVICE_NAME_LOOKUP[comparableValue] = serviceName;
    return serviceName as AwsAsset.Service;
  }

  // prefixed lookup (WAFRegion => WAF, CodeGuruProfile => CodeGuru)
  for (const serviceName of Object.keys(AwsAsset.Services)) {
    if (comparableValue.startsWith(normalizeComparisonString(serviceName))) {
      // add to lookup for constant lookkup in subsequent calls;
      SERVICE_NAME_LOOKUP[comparableValue] = serviceName;
      return serviceName as AwsAsset.Service;
    }
  }

  throw new Error(
    `Failed to resolve serviceName ${value} (${comparableValue})`
  );
}

/**
 * Extracted service name definition
 * @internal
 */
export interface ExtractedServiceName {
  readonly serviceName: AwsAsset.Service;
  readonly match: string;
  readonly rest?: string;
  readonly resolvedValue: string;
}

/**
 * Extract service name parts from value that is or contains a service name or variant of service name.
 * @internal
 */
export function extractResolvedServiceName(
  value: string
): ExtractedServiceName | undefined {
  const parts = normalizeIdentifier(value).split("_");

  for (let i = parts.length; i > 0; i--) {
    try {
      const match = parts.slice(0, i).join("_");
      const serviceName = resolveServiceName(match);
      let rest: string | undefined = value.replace(match, "");
      if (rest.length === 0) {
        rest = undefined;
      }
      const resolvedValue = `${serviceName}${rest}`;
      return { serviceName, match, rest, resolvedValue };
    } catch {
      continue;
    }
  }

  return;
}
