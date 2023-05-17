/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedPythonCdkInfrastructureProject } from "../../../src/project/codegen/infrastructure/cdk/generated-python-cdk-infrastructure-project";
import { GeneratedPythonRuntimeProject } from "../../../src/project/codegen/runtime/generated-python-runtime-project";
import { withTmpDirSnapshot } from "../../project/snapshot-utils";

describe("Python Infrastructure Code Generation Script Unit Tests", () => {
  it.each(["single.yaml"])("Generates With %s", (spec) => {
    const specPath = path.resolve(__dirname, `../../resources/specs/${spec}`);

    expect(
      withTmpDirSnapshot(path.resolve(__dirname), (outdir) => {
        const clientOutdir = path.join(outdir, "client");
        const client = new GeneratedPythonRuntimeProject({
          name: "test-client",
          moduleName: "test_client",
          authorEmail: "me@example.com",
          authorName: "test",
          version: "1.0.0",
          outdir: clientOutdir,
          specPath: path.relative(clientOutdir, specPath),
        });
        const infraOutdir = path.join(outdir, "infra");
        const project = new GeneratedPythonCdkInfrastructureProject({
          name: "test-infra",
          moduleName: "test_infra",
          authorEmail: "me@example.com",
          authorName: "test",
          version: "1.0.0",
          outdir: infraOutdir,
          specPath: path.relative(infraOutdir, specPath),
          generatedPythonTypes: client,
        });
        const command = project.buildGenerateCommand();
        exec(command.command, {
          cwd: command.workingDir,
        });
      })["infra/test_infra/api.py"]
    ).toMatchSnapshot();
  });
});
