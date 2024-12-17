/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CfnJson, Lazy, Token } from "aws-cdk-lib";
import { Construct } from "constructs";

const isUnresolved = (value: any) =>
  Token.isUnresolved(value) ||
  (typeof value === "string" && value.endsWith("}}"));

const resolveTokens = (scope: Construct, payload: any) => {
  const _runtimeConfig: Record<string, any> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (isUnresolved(value)) {
      _runtimeConfig[key] = new CfnJson(scope, `runtimeConfig-${key}`, {
        value,
      }).value;
    } else if (typeof value === "object") {
      _runtimeConfig[key] = resolveTokens(scope, value);
    } else if (Array.isArray(value)) {
      _runtimeConfig[key] = value.map((v) => resolveTokens(scope, v));
    } else {
      _runtimeConfig[key] = value;
    }
  });

  return _runtimeConfig;
};

export const lazilyRender = (scope: Construct, payload: any) =>
  Lazy.any({
    produce: () => resolveTokens(scope, payload),
  });
