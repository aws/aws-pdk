/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsAsset } from "../../generated/assets";
import { normalizeComparisonString } from "../../utils";
import { NORMALIZED_RESOURCE_VARIANTS } from "./variants";

/** @internal */
const RESOURCE_LOOKUP: { [key: string]: string } = Object.fromEntries([
  ...Object.keys(AwsAsset.Resources).flatMap((key) => {
    return [
      // constant self lookup
      [key, key],
      // constant comparable
      [normalizeComparisonString(key), key],
    ];
  }),
  ...Object.entries(NORMALIZED_RESOURCE_VARIANTS).flatMap(([key, variants]) => {
    if (variants == null) return [];
    return variants.map((variant) => [normalizeComparisonString(variant), key]);
  }),
]);

/**
 * Resolve resource name value to asset based service key.
 * @internal
 */
export function resolveResourceName(
  value: string,
  service?: AwsAsset.Service
): AwsAsset.Resource {
  // constant lookup first for perf
  const comparableValue = normalizeComparisonString(value);
  if (comparableValue in RESOURCE_LOOKUP) {
    return RESOURCE_LOOKUP[comparableValue] as AwsAsset.Resource;
  }

  if (service) {
    const servicePrefixed = `${normalizeComparisonString(
      service
    )}${comparableValue}`;
    if (servicePrefixed in RESOURCE_LOOKUP) {
      const resourceName = RESOURCE_LOOKUP[
        servicePrefixed
      ] as AwsAsset.Resource;
      RESOURCE_LOOKUP[comparableValue] = resourceName;
      return resourceName;
    }
  }

  throw new Error(
    `Failed to resolve resourceName ${value} [${service}] (${comparableValue})`
  );
}
