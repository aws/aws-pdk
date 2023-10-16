/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CfnFunction, Function, FunctionProps } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

/**
 * Options for the SnapStartFunction construct
 */
export interface SnapStartFunctionProps extends FunctionProps {
  /**
   * When true, disable snap start
   * @default false
   */
  readonly disableSnapStart?: boolean;
}

/**
 * A lambda function which enables SnapStart on published versions by default
 */
export class SnapStartFunction extends Function {
  constructor(scope: Construct, id: string, props: SnapStartFunctionProps) {
    super(scope, id, props);

    if (!props.disableSnapStart) {
      (this.node.defaultChild as CfnFunction).addPropertyOverride("SnapStart", {
        ApplyOn: "PublishedVersions",
      });
    }
  }
}
