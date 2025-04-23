/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjectUtils, addMetric, getUniqueMetrics } from "@aws/monorepo";
import { IAspect, Stack } from "aws-cdk-lib";
import { IConstruct } from "constructs";

/**
 * Adds information to CloudFormation stack descriptions to provide usage metrics for @aws/pdk
 */
export class MetricsAspect implements IAspect {
  visit(node: IConstruct): void {
    addMetric(node, "pdk-nag");

    if (node instanceof Stack) {
      const id = "uksb-cqzupzpfff";
      const version = ProjectUtils.getPdkVersion();
      const tags: string[] = getUniqueMetrics(node).map((m) => m.metric);
      node.templateOptions.description = `${
        node.templateOptions.description ?? ""
      } (${id}) (version:${version}) (tag:${tags.join(",")})`.trim();
    }
  }
}
