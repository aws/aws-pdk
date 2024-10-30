/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedJavaRuntimeProject } from "../../../src/project/codegen/runtime/generated-java-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Java Client Code Generation Script Unit Tests", () => {
  it.each([
    "single.yaml",
    "multiple-tags.yaml",
    "data-types.yaml",
    "edge-cases.yaml",
    "parameter-refs.yaml",
    "default-response.yaml",
    "allof-model.yaml",
    "composite-models.yaml",
    "recursive.yaml",
  ])("Generates With %s", (spec) => {
    const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

    expect(
      withTmpDirSnapshot(
        os.tmpdir(),
        (outdir) => {
          exec(`cp ${specPath} ${outdir}/spec.yaml`, {
            cwd: path.resolve(__dirname),
          });
          const project = new GeneratedJavaRuntimeProject({
            name: "test",
            artifactId: "com.aws.pdk.test",
            groupId: "test",
            version: "1.0.0",
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
          excludeGlobs: ["spec.yaml"],
          parseJson: false,
        }
      )
    ).toMatchSnapshot();
  });
});
