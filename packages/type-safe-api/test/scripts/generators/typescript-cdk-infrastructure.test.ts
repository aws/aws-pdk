/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { getTestHandlerProjects } from "./utils";
import { OpenApiToolsJsonFile } from "../../../src/project/codegen/components/open-api-tools-json-file";
import { GeneratedTypescriptCdkInfrastructureProject } from "../../../src/project/codegen/infrastructure/cdk/generated-typescript-cdk-infrastructure-project";
import { GeneratedTypescriptRuntimeProject } from "../../../src/project/codegen/runtime/generated-typescript-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Typescript Infrastructure Code Generation Script Unit Tests", () => {
  it.each(["single.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

    const snapshot = withTmpDirSnapshot(os.tmpdir(), (outdir) => {
      exec(`cp ${specPath} ${outdir}/spec.yaml`, {
        cwd: path.resolve(__dirname),
      });
      const clientOutdir = path.join(outdir, "client");
      const client = new GeneratedTypescriptRuntimeProject({
        name: "test-client",
        defaultReleaseBranch: "main",
        outdir: clientOutdir,
        specPath: "../spec.yaml",
      });
      const infraOutdir = path.join(outdir, "infra");
      const project = new GeneratedTypescriptCdkInfrastructureProject({
        name: "test-infra",
        defaultReleaseBranch: "main",
        outdir: infraOutdir,
        specPath: "../spec.yaml",
        generatedTypescriptTypes: client,
        generatedHandlers: {},
      });
      // Synth the openapitools.json since it's used by the generate command
      OpenApiToolsJsonFile.of(project)!.synthesize();
      exec(
        `${path.resolve(
          __dirname,
          "../../../scripts/generators/generate"
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

  it("Generates With Mocks Disabled", () => {
    const specPath = path.resolve(
      __dirname,
      `../../resources/specs/single.yaml`
    );

    const snapshot = withTmpDirSnapshot(os.tmpdir(), (outdir) => {
      exec(`cp ${specPath} ${outdir}/spec.yaml`, {
        cwd: path.resolve(__dirname),
      });
      const clientOutdir = path.join(outdir, "client");
      const client = new GeneratedTypescriptRuntimeProject({
        name: "test-client",
        defaultReleaseBranch: "main",
        outdir: clientOutdir,
        specPath: "../spec.yaml",
      });
      const infraOutdir = path.join(outdir, "infra");
      const project = new GeneratedTypescriptCdkInfrastructureProject({
        name: "test-infra",
        defaultReleaseBranch: "main",
        outdir: infraOutdir,
        specPath: "../spec.yaml",
        generatedTypescriptTypes: client,
        mockDataOptions: {
          disable: true,
        },
        generatedHandlers: {},
      });
      // Synth the openapitools.json since it's used by the generate command
      OpenApiToolsJsonFile.of(project)!.synthesize();
      exec(
        `${path.resolve(
          __dirname,
          "../../../scripts/generators/generate"
        )} ${project.buildGenerateCommandArgs()}`,
        {
          cwd: infraOutdir,
        }
      );
    });

    expect(snapshot["infra/src/mock-integrations.ts"]).toMatchSnapshot();
  });

  it("Generates Functions", () => {
    const specPath = path.resolve(
      __dirname,
      `../../resources/specs/handlers.yaml`
    );

    const snapshot = withTmpDirSnapshot(os.tmpdir(), (outdir) => {
      exec(`cp ${specPath} ${outdir}/spec.yaml`, {
        cwd: path.resolve(__dirname),
      });
      const { runtimes, handlers } = getTestHandlerProjects(outdir);
      const infraOutdir = path.join(outdir, "infra");
      const project = new GeneratedTypescriptCdkInfrastructureProject({
        name: "test-infra",
        defaultReleaseBranch: "main",
        outdir: infraOutdir,
        specPath: "../spec.yaml",
        generatedTypescriptTypes: runtimes.typescript,
        generatedHandlers: handlers,
      });
      project.synth();
      exec(
        `${path.resolve(
          __dirname,
          "../../../scripts/generators/generate"
        )} ${project.buildGenerateCommandArgs()}`,
        {
          cwd: infraOutdir,
        }
      );
    });

    expect(snapshot["infra/src/functions.ts"]).toMatchSnapshot();
  });
});
