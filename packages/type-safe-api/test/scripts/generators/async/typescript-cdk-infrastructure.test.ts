/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { getTestHandlerProjects } from "./utils";
import { GeneratedTypescriptAsyncCdkInfrastructureProject } from "../../../../src/project/codegen/infrastructure/cdk/generated-typescript-async-cdk-infrastructure-project";
import { GeneratedTypescriptAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-typescript-async-runtime-project";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Typescript Async Infrastructure Code Generation Script Unit Tests", () => {
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
      const client = new GeneratedTypescriptAsyncRuntimeProject({
        name: "test-client",
        defaultReleaseBranch: "main",
        outdir: clientOutdir,
        specPath: "../spec.yaml",
      });
      const infraOutdir = path.join(outdir, "infra");
      const project = new GeneratedTypescriptAsyncCdkInfrastructureProject({
        name: "test-infra",
        defaultReleaseBranch: "main",
        outdir: infraOutdir,
        specPath: "../spec.yaml",
        generatedTypescriptTypes: client,
        generatedHandlers: {},
      });
      exec(`mkdir -p ${infraOutdir}`, { cwd: outdir });
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

    expect(snapshot["infra/src/api.ts"]).toMatchSnapshot();
    expect(snapshot["infra/src/mock-integrations.ts"]).toMatchSnapshot();
    expect(snapshot["infra/src/index.ts"]).toMatchSnapshot();
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
        const project = new GeneratedTypescriptAsyncCdkInfrastructureProject({
          name: "test-infra",
          defaultReleaseBranch: "main",
          outdir: infraOutdir,
          specPath: "../spec.yaml",
          generatedTypescriptTypes: runtimes.typescript,
          generatedHandlers: handlers,
        });
        exec(`mkdir -p ${infraOutdir}`, { cwd: outdir });
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

      expect(snapshot["infra/src/functions.ts"]).toMatchSnapshot();
    }
  );
});
