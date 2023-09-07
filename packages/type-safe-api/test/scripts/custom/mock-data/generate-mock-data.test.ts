/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import path from "path";
import { exec } from "projen/lib/util";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Generate Mock Data Unit Tests", () => {
  it("Generates Mock Data", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath = "../../../resources/specs/single.yaml";
        const outputPath = path.relative(path.resolve(__dirname), tmpDir);
        const command = `../../../../scripts/type-safe-api/custom/mock-data/generate-mock-data --spec-path ${specPath} --output-path ${outputPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });
});
