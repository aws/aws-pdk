/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

import { CfnResource } from "aws-cdk-lib";
import { NagPack, NagPackProps } from "cdk-nag";
import { IConstruct } from "constructs";
import { PackName, RuleMetadata } from "./aws-prototyping-rules";

/**
 * Check Best practices for prototypes
 *
 */
export class AwsPrototypingChecks extends NagPack {
  constructor(props?: NagPackProps) {
    super(props);
    this.packName = PackName;
  }
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      RuleMetadata.forEach((rule) => {
        this.applyRule({
          ...rule,
          node,
        });
      });
    }
  }
}
