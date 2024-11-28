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
            exec(
              `${path.resolve(
                __dirname,
                "../../../scripts/type-safe-api/run.js generate"
              )} ${project.buildGenerateCommandArgs()}`,
              {
                cwd: outdir,
              }
            );
          },
          {
            excludeGlobs: [".projen/*", "spec.yaml"],
          }
        )
      ).toMatchSnapshot();
    }
  );

  it("Generates react query v5 hooks", () => {
    const specPath = path.resolve(
      __dirname,
      `../../resources/specs/single-pagination.yaml`
    );
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
            useReactQueryV5: true,
          });
          exec(
            `${path.resolve(
              __dirname,
              "../../../scripts/type-safe-api/run.js generate"
            )} ${project.buildGenerateCommandArgs()}`,
            {
              cwd: outdir,
            }
          );
        },
        {
          excludeGlobs: [".projen/*", "spec.yaml"],
        }
      )
    ).toMatchSnapshot();
  });
});
