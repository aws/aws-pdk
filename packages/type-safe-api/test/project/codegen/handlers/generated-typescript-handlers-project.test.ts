/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedTypescriptHandlersProject } from "../../../../src/project/codegen/handlers/generated-typescript-handlers-project";
import { GeneratedTypescriptRuntimeProject } from "../../../../src/project/codegen/runtime/generated-typescript-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Typescript Handlers Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedTypescriptHandlersProject({
      outdir: path.resolve(__dirname, "ts-handlers"),
      name: "test-ts-handlers",
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
