/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { getTestHandlerProjects } from "./utils";
import { GeneratedPythonAsyncCdkInfrastructureProject } from "../../../../src/project/codegen/infrastructure/cdk/generated-python-async-cdk-infrastructure-project";
import { GeneratedPythonAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-async-runtime-project";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Python Async Infrastructure Code Generation Script Unit Tests", () => {
  it.each(["single.yaml"])("Generates With %s", (spec) => {
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
      const infraOutdir = path.join(outdir, "infra");
      const project = new GeneratedPythonAsyncCdkInfrastructureProject({
        name: "test-infra",
        moduleName: "test_infra",
        authorEmail: "me@example.com",
        authorName: "test",
        version: "1.0.0",
        outdir: infraOutdir,
        specPath: "../spec.yaml",
        generatedPythonTypes: client,
        generatedHandlers: {},
      });
      project.synth();
      exec(
        `${path.resolve(
          __dirname,
          "../../../../scripts/type-safe-api/run.js generate"
        )} ${project.buildGenerateCommandArgs()}`,
        {
          cwd: infraOutdir,
        }
      );
    });

    expect(snapshot["infra/test_infra/api.py"]).toMatchSnapshot();
    expect(snapshot["infra/test_infra/__init__.py"]).toMatchSnapshot();
    expect(snapshot["infra/test_infra/mock_integrations.py"]).toMatchSnapshot();
  });

  it.each(["handlers.yaml", "inline-body.yaml"])(
    "Generates Functions for %s",
    (specFile) => {
      const specPath = path.resolve(
        __dirname,
        `../../../resources/specs/async/${specFile}`
      );

      const snapshot = withTmpDirSnapshot(os.tmpdir(), (outdir) => {
        exec(`cp ${specPath} ${outdir}/spec.yaml`, {
          cwd: path.resolve(__dirname),
        });
        const { runtimes, handlers } = getTestHandlerProjects(outdir);

        const infraOutdir = path.join(outdir, "infra");
        const project = new GeneratedPythonAsyncCdkInfrastructureProject({
          name: "test-infra",
          moduleName: "test_infra",
          authorEmail: "me@example.com",
          authorName: "test",
          version: "1.0.0",
          outdir: infraOutdir,
          specPath: "../spec.yaml",
          generatedPythonTypes: runtimes.python,
          generatedHandlers: handlers,
        });
        project.synth();
        exec(
          `${path.resolve(
            __dirname,
            "../../../../scripts/type-safe-api/run.js generate"
          )} ${project.buildGenerateCommandArgs()}`,
          {
            cwd: infraOutdir,
          }
        );
      });

      expect(snapshot["infra/test_infra/functions.py"]).toMatchSnapshot();
    }
  );
});
