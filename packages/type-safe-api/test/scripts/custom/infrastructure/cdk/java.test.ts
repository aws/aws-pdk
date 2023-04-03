/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { exec } from "projen/lib/util";
import { GeneratedJavaCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-java-cdk-infrastructure-project";
import { GeneratedJavaRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-java-runtime-project";
import { withTmpDirSnapshot } from "../../../../project/snapshot-utils";

describe("Java Infra Generation Script Unit Tests", () => {
  it("Generates", () => {
    const specPath = path.resolve(
      __dirname,
      `../../../../resources/specs/single.yaml`
    );

    expect(
      withTmpDirSnapshot(
        path.resolve(__dirname),
        (outdir) => {
          const clientOutdir = path.join(outdir, "client");
          const client = new GeneratedJavaRuntimeProject({
            name: "test-client",
            artifactId: "com.aws.pdk.test.client",
            groupId: "test",
            version: "1.0.0",
            outdir: clientOutdir,
            specPath: path.relative(clientOutdir, specPath),
          });
          const infraOutdir = path.join(outdir, "infra");
          const project = new GeneratedJavaCdkInfrastructureProject({
            name: "test-infra",
            artifactId: "com.aws.pdk.test.infra",
            groupId: "test",
            version: "1.0.0",
            outdir: infraOutdir,
            specPath: path.relative(infraOutdir, specPath),
            generatedJavaTypes: client,
          });
          const command = project.buildGenerateCommand();
          exec(command.command, {
            cwd: command.workingDir,
          });
        },
        { parseJson: false }
      )
    ).toMatchSnapshot();
  });
});
