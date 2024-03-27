/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { getTestHandlerProjects } from "./utils";
import { OpenApiToolsJsonFile } from "../../../../src/project/codegen/components/open-api-tools-json-file";
import { GeneratedJavaAsyncCdkInfrastructureProject } from "../../../../src/project/codegen/infrastructure/cdk/generated-java-async-cdk-infrastructure-project";
import { GeneratedJavaAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-java-async-runtime-project";
import { withTmpDirSnapshot } from "../../../project/snapshot-utils";

describe("Java Async Infrastructure Code Generation Script Unit Tests", () => {
  it.each(["single.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(
      __dirname,
      `../../../resources/specs/async/${spec}`
    );

    const snapshot = withTmpDirSnapshot(
      os.tmpdir(),
      (outdir) => {
        exec(`cp ${specPath} ${outdir}/spec.yaml`, {
          cwd: path.resolve(__dirname),
        });
        const clientOutdir = path.join(outdir, "client");
        const client = new GeneratedJavaAsyncRuntimeProject({
          name: "test-client",
          artifactId: "com.aws.pdk.test.client",
          groupId: "test",
          version: "1.0.0",
          outdir: clientOutdir,
          specPath: "../spec.yaml",
        });
        const infraOutdir = path.join(outdir, "infra");
        const project = new GeneratedJavaAsyncCdkInfrastructureProject({
          name: "test-infra",
          artifactId: "com.aws.pdk.test.infra",
          groupId: "test",
          version: "1.0.0",
          outdir: infraOutdir,
          specPath: "../spec.yaml",
          generatedJavaTypes: client,
          generatedHandlers: {},
        });
        // Synth the openapitools.json since it's used by the generate command
        OpenApiToolsJsonFile.of(project)!.synthesize();
        exec(`mkdir -p ${infraOutdir}`, { cwd: outdir });
        exec(
          project.tasks.tryFind("create-openapitools.json")!.steps[0].exec!,
          { cwd: infraOutdir }
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
      },
      {
        excludeGlobs: GeneratedJavaAsyncRuntimeProject.openApiIgnorePatterns,
        parseJson: false,
      }
    );

    expect(
      snapshot["infra/src/main/java/test/test-infra/infra/Api.java"]
    ).toMatchSnapshot();
    expect(
      snapshot["infra/src/main/java/test/test-infra/infra/ApiProps.java"]
    ).toMatchSnapshot();
    expect(
      snapshot[
        "infra/src/main/java/test/test-infra/infra/MockIntegrations.java"
      ]
    ).toMatchSnapshot();
  });

  it.each(["handlers.yaml", "inline-body.yaml"])(
    "Generates Functions for %s",
    (specFile) => {
      const specPath = path.resolve(
        __dirname,
        `../../../resources/specs/async/${specFile}`
      );

      const snapshot = withTmpDirSnapshot(
        os.tmpdir(),
        (outdir) => {
          exec(`cp ${specPath} ${outdir}/spec.yaml`, {
            cwd: path.resolve(__dirname),
          });

          const { runtimes, handlers } = getTestHandlerProjects(outdir);

          const infraOutdir = path.join(outdir, "infra");
          const project = new GeneratedJavaAsyncCdkInfrastructureProject({
            name: "test-infra",
            artifactId: "com.aws.pdk.test.infra",
            groupId: "test",
            version: "1.0.0",
            outdir: infraOutdir,
            specPath: "../spec.yaml",
            generatedJavaTypes: runtimes.java,
            generatedHandlers: handlers,
          });
          project.synth();
          exec(
            project.tasks.tryFind("create-openapitools.json")!.steps[0].exec!,
            { cwd: infraOutdir }
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
        },
        {
          excludeGlobs: GeneratedJavaAsyncRuntimeProject.openApiIgnorePatterns,
          parseJson: false,
        }
      );

      expect(
        Object.entries(snapshot).filter(([file]: [string, any]) =>
          file.startsWith("infra/src/main/java/test/test-infra/infra/functions")
        )
      ).toMatchSnapshot();
    }
  );
});
