/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { Project } from "projen";
import { exec } from "projen/lib/util";
import { DocumentationFormat } from "../../../src";
import { OpenApiToolsJsonFile } from "../../../src/project/codegen/components/open-api-tools-json-file";
import {
  buildInvokeOpenApiGeneratorCommandArgs,
  OtherGenerators,
} from "../../../src/project/codegen/components/utils";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Docs Generation Script Unit Tests", () => {
  it.each([
    DocumentationFormat.HTML2,
    DocumentationFormat.MARKDOWN,
    DocumentationFormat.PLANTUML,
  ])("Generates %s", (generator) => {
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
          const openApiToolsJsonFile = OpenApiToolsJsonFile.ensure(
            new Project({ name: "test-project", outdir })
          );
          openApiToolsJsonFile.synthesize();
          exec(openApiToolsJsonFile.createTask.steps[0].exec!, { cwd: outdir });
          exec(
            `${path.resolve(
              __dirname,
              "../../../scripts/type-safe-api/generators/generate"
            )} ${buildInvokeOpenApiGeneratorCommandArgs({
              generator,
              specPath: "spec.yaml",
              generatorDirectory: OtherGenerators.DOCS,
            })}`,
            {
              cwd: outdir,
            }
          );
        },
        { excludeGlobs: ["spec.yaml"] }
      )
    ).toMatchSnapshot();
  });
});
