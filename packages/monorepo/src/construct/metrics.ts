/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Construct } from "constructs";

interface MetricInfo {
  readonly metric: string;
}

const PACKAGE_METRIC_INFO = {
  identity: { metric: "c1" },
  "pdk-nag": { metric: "c2" },
  "static-website": { metric: "c3" },
  "type-safe-rest-api": { metric: "c4" },
  "type-safe-websocket-api": { metric: "c5" },
  "cdk-graph": { metric: "c6" },
  "cdk-graph-plugin-diagram": { metric: "c7" },
  "cdk-graph-plugin-threat-composer": { metric: "c8" },
} as const satisfies Record<string, MetricInfo>;

export type PdkPackage = keyof typeof PACKAGE_METRIC_INFO;

const METRICS_METADATA_TYPE = "__aws-pdk-metric";

/**
 * Add construct metric info
 */
export const addMetric = (scope: Construct, pkg: PdkPackage) => {
  // Add metric info to the root node
  const metricInfo = PACKAGE_METRIC_INFO[pkg];
  const root = scope?.node?.root?.node;
  if (metricInfo && root) {
    root.addMetadata(METRICS_METADATA_TYPE, PACKAGE_METRIC_INFO[pkg]);
  }
};

/**
 * Gets registered metrics from the construct tree
 */
export const getUniqueMetrics = (scope: Construct): MetricInfo[] => {
  const root = scope?.node?.root?.node;
  const metrics = (root?.metadata ?? [])
    .filter((m) => m.type === METRICS_METADATA_TYPE)
    .map((m) => m.data) as MetricInfo[];
  const seen = new Set<string>();
  return metrics.filter((m) => {
    if (!seen.has(m.metric)) {
      seen.add(m.metric);
      return true;
    }
    return false;
  });
};
