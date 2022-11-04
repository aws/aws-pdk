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
/**
 * Normalize string value to standard identifier form.
 *
 * Removes extraneous prefixes (Amazon, AWS), replaces all non-alphanumerics with underscore (_),
 * and converts to lower-case.
 * @param value - Value to normalize
 * @returns Returns normalized identifier string.
 */
export function normalizeIdentifier(value: string): string {
  value = value.replace(/^(Amazon|AWS)-?/i, ""); // remove prefix
  value = value.replace(/[^A-Za-z0-9]/g, "_"); // only alphanum + _
  value = value.replace(/_+/g, "_"); // de-dupe _
  return value.toLowerCase();
}

const ComparisonDictionary: Record<string, string> = {
  acl: "access_control_list",
  eni: "elastic_network_interface",
  eip: "elastic_ip_address",
};

/**
 * Normalizes string value for consistent comparison with variants between systems.
 * @param value - The value to normalize for comparison
 */
export function normalizeComparisonString(value: string): string {
  value = value.replace(/\.(png|svg)$/, "");
  value = normalizeIdentifier(value);
  Object.entries(ComparisonDictionary).forEach(([_key, _value]) => {
    _value = _value.replace(new RegExp(_key, "ig"), _value);
  });
  value = value.replace(/[_-]+(amazon|aws)[_-]+/gi, "");
  value = value.replace(/_(for|on|and|the|of|&)_/gi, "");
  value = value.replace(/v\d+/g, "");
  value = value.replace(/_/g, "");
  return value;
}

/**
 * RegEx pattern for https://aws.amazon.com based urls.
 */
export const AWS_URL_PATTERN =
  /^https:\/\/(?<domain>(?:(?:docs)\.)?aws\.amazon\.com)\/(?<service>[^\/]+)(?:\/(?<resource>[^#]+))?\/?(?:#(?<dataType>.+))?$/i;

/**
 * Parsed Aws Url based on {@link AWS_URL_PATTERN}
 */
export interface ParsedAwsUrl {
  readonly domain: string;
  readonly service: string;
  readonly resource?: string;
  readonly dataType?: string;
  /**
   * @virtual
   */
  readonly code: string;
}

/** Parses https://aws.amazon.com based url into common definition. */
export function parseAwsUrl(url: string): ParsedAwsUrl {
  url = url.replace(/\/(index\.html.*)?$/, "");

  const groups = url.match(AWS_URL_PATTERN)
    ?.groups as unknown as ParsedAwsUrl | null;

  if (groups) {
    const code = normalizeIdentifier(
      `${groups.service}_${groups.resource || ""}_${groups.dataType || ""}`
    );

    return {
      ...groups,
      code,
    };
  }

  throw new Error(`Failed to parse aws url: ${url}`);
}
