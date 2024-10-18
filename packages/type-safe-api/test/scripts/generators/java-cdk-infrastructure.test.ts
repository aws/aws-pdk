/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import os from "os";
import * as path from "path";
import { exec } from "projen/lib/util";
import { getTestHandlerProjects } from "./utils";
import { GeneratedJavaCdkInfrastructureProject } from "../../../src/project/codegen/infrastructure/cdk/generated-java-cdk-infrastructure-project";
import { GeneratedJavaRuntimeProject } from "../../../src/project/codegen/runtime/generated-java-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Java Infrastructure Code Generation Script Unit Tests", () => {
  it.each(["single.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

    const snapshot = withTmpDirSnapshot(
      os.tmpdir(),
      (outdir) => {
        exec(`cp ${specPath} ${outdir}/spec.yaml`, {
          cwd: path.resolve(__dirname),
        });
        const clientOutdir = path.join(outdir, "client");
        const client = new GeneratedJavaRuntimeProject({
          name: "test-client",
          artifactId: "com.aws.pdk.test.client",
          groupId: "test",
          version: "1.0.0",
          outdir: clientOutdir,
          specPath: "../spec.yaml",
        });
        const infraOutdir = path.join(outdir, "infra");
        const project = new GeneratedJavaCdkInfrastructureProject({
          name: "test-infra",
          artifactId: "com.aws.pdk.test.infra",
          groupId: "test",
          version: "1.0.0",
          outdir: infraOutdir,
          specPath: "../spec.yaml",
          generatedJavaTypes: client,
          generatedHandlers: {},
        });
        exec(`mkdir -p ${infraOutdir}`, { cwd: outdir });
        exec(
          `${path.resolve(
            __dirname,
            "../../../scripts/type-safe-api/run.js generate"
          )} ${project.buildGenerateCommandArgs()}`,
          {
            cwd: infraOutdir,
          }
        );
      },
      {
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

  it("Generates With Mocks Disabled", () => {
    const specPath = path.resolve(
      __dirname,
      `../../resources/specs/single.yaml`
    );

    const snapshot = withTmpDirSnapshot(
      os.tmpdir(),
      (outdir) => {
        exec(`cp ${specPath} ${outdir}/spec.yaml`, {
          cwd: path.resolve(__dirname),
        });
        const clientOutdir = path.join(outdir, "client");
        const client = new GeneratedJavaRuntimeProject({
          name: "test-client",
          artifactId: "com.aws.pdk.test.client",
          groupId: "test",
          version: "1.0.0",
          outdir: clientOutdir,
          specPath: "../spec.yaml",
        });
        const infraOutdir = path.join(outdir, "infra");
        const project = new GeneratedJavaCdkInfrastructureProject({
          name: "test-infra",
          artifactId: "com.aws.pdk.test.infra",
          groupId: "test",
          version: "1.0.0",
          outdir: infraOutdir,
          specPath: "../spec.yaml",
          generatedJavaTypes: client,
          mockDataOptions: {
            disable: true,
          },
          generatedHandlers: {},
        });
        exec(`mkdir -p ${infraOutdir}`, { cwd: outdir });
        exec(
          `${path.resolve(
            __dirname,
            "../../../scripts/type-safe-api/run.js generate"
          )} ${project.buildGenerateCommandArgs()}`,
          {
            cwd: infraOutdir,
          }
        );
      },
      {
        parseJson: false,
      }
    );

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
        `../../resources/specs/${specFile}`
      );

      const snapshot = withTmpDirSnapshot(
        os.tmpdir(),
        (outdir) => {
          exec(`cp ${specPath} ${outdir}/spec.yaml`, {
            cwd: path.resolve(__dirname),
          });

          const { runtimes, handlers } = getTestHandlerProjects(outdir);

          const infraOutdir = path.join(outdir, "infra");
          const project = new GeneratedJavaCdkInfrastructureProject({
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
            `${path.resolve(
              __dirname,
              "../../../scripts/type-safe-api/run.js generate"
            )} ${project.buildGenerateCommandArgs()}`,
            {
              cwd: infraOutdir,
            }
          );
        },
        {
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
