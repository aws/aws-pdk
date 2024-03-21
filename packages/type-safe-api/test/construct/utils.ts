/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { OpenAPIV3 } from "openapi-types";

export const withTempSpec = <T>(
  spec: OpenAPIV3.Document,
  fn: (specPath: string) => T
): T => {
  const dir = fs.mkdtempSync("spec");
  try {
    const specPath = path.join(dir, "spec.json");
    fs.writeFileSync(specPath, JSON.stringify(spec));
    return fn(specPath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
