/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CfnResource } from "aws-cdk-lib";
import { NagMessageLevel } from "cdk-nag";

/**
 * Possible statuses for nag rules
 */
export enum NagResultCompliance {
  /**
   * Resource complies with the rule
   */
  COMPLIANT = "COMPLIANT",
  /**
   * Resource does not comply with the rule
   */
  NON_COMPLIANT = "NON_COMPLIANT",
  /**
   * Resource does not comply with the rule, but the rule was suppressed
   */
  NON_COMPLIANT_SUPPRESSED = "NON_COMPLIANT_SUPPRESSED",
  /**
   * An error occurred applying the rule
   */
  ERROR = "ERROR",
  /**
   * An error occurred applying the rule, but the rule was suppressed
   */
  ERROR_SUPPRESSED = "ERROR_SUPPRESSED",
  /**
   * The rule is not applicable to the resource
   */
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

/**
 * Represents the result of applying a CDK Nag rule to a resource
 */
export interface ExtendedNagResult {
  /**
   * The name of the nag pack this rule is from
   */
  readonly nagPackName: string;
  /**
   * The resource the rule was applied to
   */
  readonly resource: CfnResource;
  /**
   * The ID of the rule in this nag pack
   */
  readonly ruleId: string;
  /**
   * The original name of the rule (regardless of nag pack)
   */
  readonly ruleOriginalName: string;
  /**
   * Why the rule was triggered
   */
  readonly ruleInfo: string;
  /**
   * Why the rule exists
   */
  readonly ruleExplanation: string;
  /**
   * The severity level of the rule
   */
  readonly ruleLevel: NagMessageLevel;
  /**
   * Compliance status of the rule against the resource
   */
  readonly compliance: NagResultCompliance;
  /**
   * The finding that was checked, only set for non-compliant results
   */
  readonly findingId?: string;
  /**
   * The reason the rule was suppressed, if any
   */
  readonly suppressionReason?: string;
  /**
   * The error that was thrown, only set for error results
   */
  readonly errorMessage?: string;
}
