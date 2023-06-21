/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { OpenApiToolsJsonFile } from "../../../src/project/codegen/components/open-api-tools-json-file";
import { GeneratedTypescriptRuntimeProject } from "../../../src/project/codegen/runtime/generated-typescript-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Typescript Client Code Generation Script Unit Tests", () => {
  it.each(["single.yaml", "multiple-tags.yaml"])(
    "Generates With %s",
    (spec) => {
      const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

      expect(
        withTmpDirSnapshot(
          os.tmpdir(),
          (outdir) => {
            exec(`cp ${specPath} ${outdir}/spec.yaml`, {
              cwd: path.resolve(__dirname),
            });
            const project = new GeneratedTypescriptRuntimeProject({
              name: "test",
              defaultReleaseBranch: "main",
              outdir,
              specPath: "spec.yaml",
            });
            // Synth the openapitools.json since it's used by the generate command
            OpenApiToolsJsonFile.of(project)!.synthesize();
            exec(
              `${path.resolve(
                __dirname,
                "../../../scripts/generators/generate"
              )} ${project.buildGenerateCommandArgs()}`,
              {
                cwd: outdir,
              }
            );
          },
          {
            excludeGlobs: [
              ...GeneratedTypescriptRuntimeProject.openApiIgnorePatterns,
              "spec.yaml",
            ],
          }
        )
      ).toMatchSnapshot();
    }
  );
});
