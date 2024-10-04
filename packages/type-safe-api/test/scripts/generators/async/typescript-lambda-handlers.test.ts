/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedTypescriptAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-typescript-async-handlers-project";
import { GeneratedTypescriptAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-typescript-async-runtime-project";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Typescript Async Handlers Code Generation Script Unit Tests", () => {
  it.each(["handlers.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(
      __dirname,
      `../../../resources/specs/async/${spec}`
    );

    const snapshot = withTmpDirSnapshot(os.tmpdir(), (outdir) => {
      exec(`cp ${specPath} ${outdir}/spec.yaml`, {
        cwd: path.resolve(__dirname),
      });
      const clientOutdir = path.join(outdir, "client");
      const client = new GeneratedTypescriptAsyncRuntimeProject({
        name: "test-client",
        defaultReleaseBranch: "main",
        outdir: clientOutdir,
        specPath: "../spec.yaml",
      });
      const handlersOutdir = path.join(outdir, "handlers");
      const project = new GeneratedTypescriptAsyncHandlersProject({
        name: "test-handlers",
        defaultReleaseBranch: "main",
        outdir: handlersOutdir,
        specPath: "../spec.yaml",
        generatedTypescriptTypes: client,
      });
      project.synth();
      exec(
        `${path.resolve(
          __dirname,
          "../../../../scripts/type-safe-api/run.js generate"
        )} ${project.buildGenerateCommandArgs()}`,
        {
          cwd: handlersOutdir,
        }
      );
    });

    expect(snapshot["handlers/src/typescript-one.ts"]).toMatchSnapshot();
    expect(snapshot["handlers/src/typescript-two.ts"]).toMatchSnapshot();
    expect(snapshot["handlers/test/typescript-one.test.ts"]).toMatchSnapshot();
    expect(snapshot["handlers/test/typescript-two.test.ts"]).toMatchSnapshot();

    // Other language handlers should be skipped
    expect(
      Object.keys(snapshot).filter((p) => p.toLowerCase().includes("python"))
    ).toHaveLength(0);
    expect(
      Object.keys(snapshot).filter((p) => p.toLowerCase().includes("java"))
    ).toHaveLength(0);

    // Split file should be deleted
    expect(
      Object.keys(snapshot).filter((p) =>
        p.toLowerCase().includes("__all_handlers")
      )
    ).toHaveLength(0);
  });
});
