/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedTypescriptCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-typescript-cdk-infrastructure-project";
import { GeneratedTypescriptRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-typescript-runtime-project";
import { withTmpDirSnapshot } from "../../../../project/snapshot-utils";

describe("Typescript Infra Generation Script Unit Tests", () => {
  it("Generates", () => {
    const specPath = path.resolve(
      __dirname,
      `../../../../resources/specs/single.yaml`
    );

    expect(
      withTmpDirSnapshot(path.resolve(__dirname), (outdir) => {
        const clientOutdir = path.join(outdir, "client");
        const client = new GeneratedTypescriptRuntimeProject({
          name: "test-client",
          defaultReleaseBranch: "main",
          outdir: clientOutdir,
          specPath: path.relative(clientOutdir, specPath),
        });
        const infraOutdir = path.join(outdir, "infra");
        const project = new GeneratedTypescriptCdkInfrastructureProject({
          name: "test-infra",
          defaultReleaseBranch: "main",
          outdir: infraOutdir,
          specPath: path.relative(infraOutdir, specPath),
          generatedTypescriptTypes: client,
        });
        const command = project.buildGenerateCommand();
        exec(command.command, {
          cwd: command.workingDir,
        });
      })
    ).toMatchSnapshot();
  });
});
