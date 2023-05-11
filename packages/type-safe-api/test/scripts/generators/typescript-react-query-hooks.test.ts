/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
          path.resolve(__dirname),
          (outdir) => {
            const project = new TypescriptReactQueryHooksLibrary({
              name: "test",
              defaultReleaseBranch: "main",
              outdir,
              specPath: path.relative(outdir, specPath),
            });
            // Synth the project so that the generate command honours the .openapi-generator-ignore-handlebars file
            project.synth();
            const command = project.buildGenerateCommand();
            exec(command.command, {
              cwd: command.workingDir,
            });
          },
          {
            excludeGlobs: [
              ...TypescriptReactQueryHooksLibrary.openApiIgnorePatterns,
              ".projen/*",
            ],
          }
        )
      ).toMatchSnapshot();
    }
  );
});
