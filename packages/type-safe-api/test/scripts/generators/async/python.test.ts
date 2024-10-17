/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedPythonAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-async-runtime-project";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Python Async Runtime Code Generation Script Unit Tests", () => {
  it.each(["single.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(
      __dirname,
      `../../../resources/specs/async/${spec}`
    );

    expect(
      withTmpDirSnapshot(os.tmpdir(), (outdir) => {
        exec(`cp ${specPath} ${outdir}/spec.yaml`, {
          cwd: path.resolve(__dirname),
        });
        const project = new GeneratedPythonAsyncRuntimeProject({
          name: "test_project",
          moduleName: "test_project",
          authorEmail: "me@example.com",
          authorName: "test",
          version: "1.0.0",
          outdir,
          specPath: "spec.yaml",
        });
        project.synth();
        exec(
          `${path.resolve(
            __dirname,
            "../../../../scripts/type-safe-api/run.js generate"
          )} ${project.buildGenerateCommandArgs()}`,
          {
            cwd: outdir,
          }
        );
        return {
          excludeGlobs: ["spec.yaml", ".github"],
        };
      })
    ).toMatchSnapshot();
  });
});
