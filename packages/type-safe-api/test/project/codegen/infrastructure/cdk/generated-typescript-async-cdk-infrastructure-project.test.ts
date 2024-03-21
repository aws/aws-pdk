/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedTypescriptAsyncCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-typescript-async-cdk-infrastructure-project";
import { GeneratedTypescriptAsyncRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-typescript-async-runtime-project";
import { synthProject } from "../../../snapshot-utils";

describe("Generated Typescript Async Infra Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedTypescriptAsyncCdkInfrastructureProject({
      outdir: path.resolve(__dirname, "ts-async-infra"),
      name: "test-ts-infra",
      defaultReleaseBranch: "main",
      specPath: "my-spec.json",
      generatedTypescriptTypes: new GeneratedTypescriptAsyncRuntimeProject({
        outdir: path.resolve(__dirname, "ts-async-client"),
        name: "test-ts-client",
        defaultReleaseBranch: "main",
        specPath: "my-spec.json",
      }),
      generatedHandlers: {},
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
