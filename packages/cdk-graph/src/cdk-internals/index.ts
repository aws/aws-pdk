/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ISynthesisSession } from "aws-cdk-lib";
import { IConstruct } from "constructs";

/**
 * Symbol for accessing jsii runtime information
 *
 * Introduced in jsii 1.19.0, cdk 1.90.0.
 *
 * @see https://github.com/aws/aws-cdk/blob/cea1039e3664fdfa89c6f00cdaeb1a0185a12678/packages/%40aws-cdk/core/lib/private/runtime-info.ts#L17
 *
 * @internal
 */
const JSII_RUNTIME_SYMBOL = Symbol.for("jsii.rtti");

/**
 * Symbol to identify custom cdk synthesis method.
 *
 * @internal
 */
const CUSTOM_SYNTHESIS_SYM = Symbol.for("@aws-cdk/core:customSynthesis");

/**
 * Interface for constructs that want to do something custom during synthesis
 *
 * This feature is intended for use by official AWS CDK libraries only; 3rd party
 * library authors and CDK users should not use this function.
 *
 * **TODO**: Find an alternative synthesis solution that does not conflict with
 * the above statement. Before this package is stable, this should be resolved.
 *
 * @internal
 */
export interface ICustomSynthesis {
  /**
   * Called when the construct is synthesized
   */
  onSynthesize(session: ISynthesisSession): void;
}

/**
 * Cdk internal function for mapping construct synthesis property
 * for custom synthesis handling.
 *
 * @internal
 */
export function addCustomSynthesis(
  construct: IConstruct,
  synthesis: ICustomSynthesis
): void {
  Object.defineProperty(construct, CUSTOM_SYNTHESIS_SYM, {
    value: synthesis,
    enumerable: false,
  });
}

/**
 * Source information on a construct (class fqn and version)
 *
 * @see https://github.com/aws/aws-cdk/blob/cea1039e3664fdfa89c6f00cdaeb1a0185a12678/packages/%40aws-cdk/core/lib/private/runtime-info.ts#L22
 */
export interface ConstructInfo {
  readonly fqn: string;
  readonly version: string;
}

/**
 * Retrieve {@link ConstructInfo} for a {@link IConstruct}
 * @see https://github.com/aws/aws-cdk/blob/cea1039e3664fdfa89c6f00cdaeb1a0185a12678/packages/%40aws-cdk/core/lib/private/runtime-info.ts#L46
 */
export function constructInfoFromConstruct(
  construct: IConstruct
): ConstructInfo | undefined {
  const jsiiRuntimeInfo =
    Object.getPrototypeOf(construct).constructor[JSII_RUNTIME_SYMBOL];
  if (
    typeof jsiiRuntimeInfo === "object" &&
    jsiiRuntimeInfo !== null &&
    typeof jsiiRuntimeInfo.fqn === "string" &&
    typeof jsiiRuntimeInfo.version === "string"
  ) {
    return { fqn: jsiiRuntimeInfo.fqn, version: jsiiRuntimeInfo.version };
  } else if (jsiiRuntimeInfo) {
    // There is something defined, but doesn't match our expectations. Fail fast and hard.
    throw new Error(
      `malformed jsii runtime info for construct: '${construct.node.path}'`
    );
  }
  return undefined;
}
