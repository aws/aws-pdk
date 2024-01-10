/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * Details about the application to include in the threat model
 */
export interface ThreatComposerApplicationDetails {
  /**
   * The name of the application
   * @default "My Application"
   */
  readonly name?: string;
  /**
   * A description of the application
   */
  readonly description?: string;
}
