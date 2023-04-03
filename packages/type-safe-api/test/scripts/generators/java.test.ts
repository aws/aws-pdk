/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedJavaRuntimeProject } from "../../../src/project/codegen/runtime/generated-java-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Java Client Code Generation Script Unit Tests", () => {
  it.each(["single.yaml", "multiple-tags.yaml"])(
    "Generates With %s",
    (spec) => {
      const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

      expect(
        withTmpDirSnapshot(
          path.resolve(__dirname),
          (outdir) => {
            const project = new GeneratedJavaRuntimeProject({
              name: "test",
              artifactId: "com.aws.pdk.test",
              groupId: "test",
              version: "1.0.0",
              outdir,
              specPath: path.relative(outdir, specPath),
            });
            const command = project.buildGenerateCommand();
            exec(command.command, {
              cwd: command.workingDir,
            });
          },
          {
            excludeGlobs: GeneratedJavaRuntimeProject.openApiIgnorePatterns,
            parseJson: false,
          }
        )
      ).toMatchSnapshot();
    }
  );
});
