/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { exec } from "projen/lib/util";
import { OpenApiToolsJsonFile } from "../../../src/project/codegen/components/open-api-tools-json-file";
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
            // Synth the openapitools.json since it's used by the generate command
            OpenApiToolsJsonFile.of(project)!.synthesize();
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
