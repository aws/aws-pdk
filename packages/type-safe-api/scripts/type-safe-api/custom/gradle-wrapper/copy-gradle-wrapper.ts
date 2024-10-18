/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";

const GRADLE_WRAPPER_DIR = "gradle/wrapper";

const copyFromScriptDir = (rootScriptDir: string, file: string) => {
  if (!fs.existsSync(file)) {
    fs.copyFileSync(path.join(rootScriptDir, "custom", "gradle-wrapper", file), file);
  }
}

export default async (_argv: string[], rootScriptDir: string) => {
  // Create the gradle wrapper directory if it doesn't already exist
  fs.mkdirSync(GRADLE_WRAPPER_DIR, { recursive: true });

  // Copy the gradle wrapper files into the working directory
  [
    path.join(GRADLE_WRAPPER_DIR, "gradle-wrapper.jar"),
    path.join(GRADLE_WRAPPER_DIR, "gradle-wrapper.properties"),
    "gradlew",
    "gradlew.bat",
  ].forEach((file) => copyFromScriptDir(rootScriptDir, file));
};
