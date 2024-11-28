/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("TypeScript ESM Generator Tests", () => {
  it.each([
    ["typescript", "handlers.yaml"],
    ["typescript-async-runtime", "async/handlers.yaml"],
    ["typescript-cdk-infrastructure", "handlers.yaml"],
    ["typescript-async-cdk-infrastructure", "async/handlers.yaml"],
    ["typescript-lambda-handlers", "handlers.yaml"],
    ["typescript-async-lambda-handlers", "async/handlers.yaml"],
    ["typescript-websocket-client", "async/handlers.yaml"],
    ["typescript-react-query-hooks", "handlers.yaml"],
    ["typescript-websocket-hooks", "async/handlers.yaml"],
  ])("Generates %s with ESM compatible syntax", (templateDir, spec) => {
    const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);
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
            )} --templateDirs "${templateDir}" --specPath spec.yaml --outputPath ${outdir} --metadata '${JSON.stringify(
              {
                esm: true,
                srcDir: "src",
                tstDir: "test",
                runtimePackageName: "@test/runtime",
                relativeSpecPath: "spec.yaml",
                "x-handlers-python-module": "test_py",
                "x-handlers-java-package": "com.java.test",
                "x-handlers-typescript-asset-path": "test/ts/dist",
                "x-handlers-python-asset-path": "test/py/dist",
                "x-handlers-java-asset-path": "test/java/dist",
                "x-handlers-node-lambda-runtime-version": "NODEJS_20_X",
                "x-handlers-python-lambda-runtime-version": "PYTHON_3_12",
                "x-handlers-java-lambda-runtime-version": "JAVA_21",
              }
            )}'`,
            {
              cwd: outdir,
            }
          );
        },
        {
          excludeGlobs: ["spec.yaml"],
        }
      )
    ).toMatchSnapshot();
  });
});
