/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";

const SMITHY_ASYNC_DIR = ".smithy-async";
const JAR_NAME = "aws-pdk-smithy-async-transformer.jar";

export default async (_argv: string[], rootScriptDir: string) => {
  // Create the smithy transformer dir
  fs.mkdirSync(SMITHY_ASYNC_DIR, { recursive: true });

  // Copy the jar if it doesn't already exist
  const sourceJarPath = path.join(rootScriptDir, "custom", "smithy-async-transformer", JAR_NAME);
  const destinationJarPath = path.join(SMITHY_ASYNC_DIR, JAR_NAME);

  if (!fs.existsSync(destinationJarPath)) {
    fs.copyFileSync(sourceJarPath, destinationJarPath);
  }
};
