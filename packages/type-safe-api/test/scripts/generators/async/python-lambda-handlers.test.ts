/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedPythonAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-python-async-handlers-project";
import { GeneratedPythonAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-async-runtime-project";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Python Async Handlers Code Generation Script Unit Tests", () => {
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
      const client = new GeneratedPythonAsyncRuntimeProject({
        name: "test-client",
        moduleName: "test_client",
        authorEmail: "me@example.com",
        authorName: "test",
        version: "1.0.0",
        outdir: clientOutdir,
        specPath: "../spec.yaml",
      });
      const handlersOutdir = path.join(outdir, "handlers");
      const project = new GeneratedPythonAsyncHandlersProject({
        name: "test-handlers",
        moduleName: "test_handlers",
        authorEmail: "me@example.com",
        authorName: "test",
        version: "1.0.0",
        outdir: handlersOutdir,
        specPath: "../spec.yaml",
        generatedPythonTypes: client,
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

    expect(snapshot["handlers/test_handlers/python_one.py"]).toMatchSnapshot();
    expect(snapshot["handlers/test_handlers/python_two.py"]).toMatchSnapshot();
    expect(snapshot["handlers/test/test_python_one.py"]).toMatchSnapshot();
    expect(snapshot["handlers/test/test_python_two.py"]).toMatchSnapshot();

    // Other language handlers should be skipped
    expect(
      Object.keys(snapshot).filter((p) =>
        p.toLowerCase().includes("typescript")
      )
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
