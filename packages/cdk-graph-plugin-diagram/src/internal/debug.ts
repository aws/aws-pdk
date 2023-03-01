/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/**
 * Indicates if debugging is enabled
 * @internal
 */
export const IS_DEBUG = (process.env.DEBUG || "").includes("cdk-graph");
