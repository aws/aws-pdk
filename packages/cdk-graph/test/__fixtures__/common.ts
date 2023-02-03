/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Environment } from "aws-cdk-lib";

export const ENVIRONMENTS = {
  DEFAULT: {
    account: "000000000000",
    region: "us-east-1",
  } as Required<Environment>,
  DEV: {
    account: "111111111111",
    region: "us-west-1",
  } as Required<Environment>,
  STAGING: {
    account: "222222222222",
    region: "us-west-2",
  } as Required<Environment>,
  PROD: {
    account: "333333333333",
    region: "us-east-1",
  } as Required<Environment>,
} as const;
