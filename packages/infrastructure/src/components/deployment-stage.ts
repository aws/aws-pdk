/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
export interface DeploymentStage {
  /**
   * Stage name.
   */
  readonly stageName: string;

  /**
   * Account to deploy into.
   */
  readonly account: number;

  /**
   * AWS region to deploy into.
   */
  readonly region: string;
}
