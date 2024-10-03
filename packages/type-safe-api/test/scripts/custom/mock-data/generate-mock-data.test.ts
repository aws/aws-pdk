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
        const command = `../../../../scripts/type-safe-api/run.js generate-mock-data --specPath ${specPath} --outputPath ${outputPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });

  it("Generates Mock Data For Recursive Definitions", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath = "../../../resources/specs/recursive.yaml";
        const outputPath = path.relative(path.resolve(__dirname), tmpDir);
        const command = `../../../../scripts/type-safe-api/run.js generate-mock-data --specPath ${specPath} --outputPath ${outputPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });

  it("Generates Mock Data For Recursive Definitions With Required Recursive Reference", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath = "../../../resources/specs/recursive-required.yaml";
        const outputPath = path.relative(path.resolve(__dirname), tmpDir);
        const command = `../../../../scripts/type-safe-api/run.js generate-mock-data --specPath ${specPath} --outputPath ${outputPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });

  it("Generates Mock Data For Many Data Types", () => {
    expect(
      withTmpDirSnapshot(os.tmpdir(), (tmpDir) => {
        const specPath = "../../../resources/specs/data-types.yaml";
        const outputPath = path.relative(path.resolve(__dirname), tmpDir);
        const command = `../../../../scripts/type-safe-api/run.js generate-mock-data --specPath ${specPath} --outputPath ${outputPath}`;
        exec(command, {
          cwd: path.resolve(__dirname),
        });
      })
    ).toMatchSnapshot();
  });
});
