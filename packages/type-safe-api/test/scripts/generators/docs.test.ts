/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { buildCodegenCommandArgs } from "../../../lib/project/codegen/components/utils";
import { DocumentationFormat } from "../../../src";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Docs Generation Script Unit Tests", () => {
  it.each([DocumentationFormat.MARKDOWN, DocumentationFormat.PLANTUML])(
    "Generates %s",
    (format) => {
      const specPath = path.resolve(
        __dirname,
        `../../resources/specs/single.yaml`
      );

      expect(
        withTmpDirSnapshot(
          os.tmpdir(),
          (outdir) => {
            exec(`cp ${specPath} ${outdir}/spec.yaml`, {
              cwd: path.resolve(__dirname),
            });
            exec(
              `${path.resolve(
                __dirname,
                "../../../scripts/type-safe-api/run.js generate"
              )} ${buildCodegenCommandArgs({
                specPath: "spec.yaml",
                templateDirs: [`docs/templates/${format}`],
              })}`,
              {
                cwd: outdir,
              }
            );
          },
          { excludeGlobs: ["spec.yaml"] }
        )
      ).toMatchSnapshot();
    }
  );
});
