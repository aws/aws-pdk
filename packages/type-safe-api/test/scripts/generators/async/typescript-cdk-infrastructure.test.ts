/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { getTestHandlerProjects } from "./utils";
import { OpenApiToolsJsonFile } from "../../../../src/project/codegen/components/open-api-tools-json-file";
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
      // Synth the openapitools.json since it's used by the generate command
      OpenApiToolsJsonFile.of(project)!.synthesize();
      exec(`mkdir -p ${infraOutdir}`, { cwd: outdir });
      exec(project.tasks.tryFind("create-openapitools.json")!.steps[0].exec!, {
        cwd: infraOutdir,
      });
      exec(
        `${path.resolve(
          __dirname,
          "../../../../scripts/type-safe-api/generators/generate"
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
        project.synth();
        exec(
          project.tasks.tryFind("create-openapitools.json")!.steps[0].exec!,
          {
            cwd: infraOutdir,
          }
        );
        exec(
          `${path.resolve(
            __dirname,
            "../../../../scripts/type-safe-api/generators/generate"
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
