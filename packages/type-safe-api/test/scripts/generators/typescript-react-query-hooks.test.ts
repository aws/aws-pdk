/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { TypescriptReactQueryHooksLibrary } from "../../../src/project/codegen/library/typescript-react-query-hooks-library";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Typescript React Query Hooks Code Generation Script Unit Tests", () => {
  it.each(["single-pagination.yaml", "multiple-tags.yaml"])(
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
            const project = new TypescriptReactQueryHooksLibrary({
              name: "test",
              defaultReleaseBranch: "main",
              outdir,
              specPath: "spec.yaml",
            });
            // Synth the project so that the generate command honours the .openapi-generator-ignore-handlebars file
            project.synth();
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
              ...TypescriptReactQueryHooksLibrary.openApiIgnorePatterns,
              ".projen/*",
              "spec.yaml",
            ],
          }
        )
      ).toMatchSnapshot();
    }
  );

  it("Generates Paginated Hooks With Smithy @paginated trait", () => {
    const resourcePath = path.resolve(
      __dirname,
      "../../resources/smithy/simple-pagination"
    );
    const specPath = path.join(resourcePath, "openapi.json");
    const smithyJsonModelPath = path.join(resourcePath, "model.json");

    const snapshot = withTmpDirSnapshot(
      os.tmpdir(),
      (outdir) => {
        exec(`cp ${specPath} ${outdir}/openapi.json`, {
          cwd: path.resolve(__dirname),
        });
        exec(`cp ${smithyJsonModelPath} ${outdir}/model.json`, {
          cwd: path.resolve(__dirname),
        });
        const project = new TypescriptReactQueryHooksLibrary({
          name: "test",
          defaultReleaseBranch: "main",
          outdir,
          specPath: "openapi.json",
          smithyJsonModelPath: "model.json",
        });
        // Synth the project so that the generate command honours the .openapi-generator-ignore-handlebars file
        project.synth();
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
          ...TypescriptReactQueryHooksLibrary.openApiIgnorePatterns,
          ".projen/*",
          "spec.yaml",
        ],
      }
    );

    expect(snapshot["src/apis/DefaultApiHooks.ts"]).toMatchSnapshot();
  });
});
