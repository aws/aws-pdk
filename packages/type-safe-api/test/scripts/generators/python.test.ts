/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedPythonRuntimeProject } from "../../../src/project/codegen/runtime/generated-python-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Python Client Code Generation Script Unit Tests", () => {
  it.each(["single.yaml", "multiple-tags.yaml"])(
    "Generates With %s",
    (spec) => {
      const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

      expect(
        withTmpDirSnapshot(
          path.resolve(__dirname),
          (outdir) => {
            const project = new GeneratedPythonRuntimeProject({
              name: "test",
              moduleName: "test",
              authorEmail: "me@example.com",
              authorName: "test",
              version: "1.0.0",
              outdir,
              specPath: path.relative(outdir, specPath),
            });
            const command = project.buildGenerateCommand();
            exec(command.command, {
              cwd: command.workingDir,
            });
          },
          { excludeGlobs: GeneratedPythonRuntimeProject.openApiIgnorePatterns }
        )
      ).toMatchSnapshot();
    }
  );
});
