/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import * as fs from "fs-extra";
import { toMatchImageSnapshot } from "jest-image-snapshot";

expect.extend({ toMatchImageSnapshot });

export async function makeCdkOutDir(...name: string[]): Promise<string> {
  const dir = path.join(__dirname, "..", ".tmp", ...name, "cdk.out");

  await fs.ensureDir(dir);
  await fs.emptyDir(dir);

  return dir;
}
