/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedTypescriptCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-typescript-cdk-infrastructure-project";
import { GeneratedTypescriptRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-typescript-runtime-project";
import { synthProject } from "../../../snapshot-utils";

describe("Generated Typescript Infra Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedTypescriptCdkInfrastructureProject({
      outdir: path.resolve(__dirname, "ts-infra"),
      name: "test-ts-infra",
      defaultReleaseBranch: "main",
      specPath: "my-spec.json",
      generatedTypescriptTypes: new GeneratedTypescriptRuntimeProject({
        outdir: path.resolve(__dirname, "ts-client"),
        name: "test-ts-client",
        defaultReleaseBranch: "main",
        specPath: "my-spec.json",
      }),
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
