/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";

/**
 * Interface which internal projects must implement
 */
export interface PDKInternalProject {
  readonly __internal: true;
}

export class PDKInternalProjectUtils {
  /**
   * Return whether the project is internal
   */
  public static isInternal = (p: Project): boolean =>
    p && (p as any).__internal;
}
