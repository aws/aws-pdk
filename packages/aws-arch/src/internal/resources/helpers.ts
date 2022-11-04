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
