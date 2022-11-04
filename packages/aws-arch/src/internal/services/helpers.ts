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
import { normalizeComparisonString, normalizeIdentifier } from "../../utils";
import { NORMALIZED_SERVICE_VARIANTS } from "./variants";

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
