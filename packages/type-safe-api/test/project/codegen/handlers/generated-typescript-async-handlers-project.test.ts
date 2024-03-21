/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedTypescriptAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-typescript-async-handlers-project";
import { GeneratedTypescriptAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-typescript-async-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Typescript Async Handlers Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedTypescriptAsyncHandlersProject({
      outdir: path.resolve(__dirname, "ts-async-handlers"),
      name: "test-ts-handlers",
      defaultReleaseBranch: "main",
      specPath: "my-spec.json",
      generatedTypescriptTypes: new GeneratedTypescriptAsyncRuntimeProject({
        outdir: path.resolve(__dirname, "ts-async-client"),
        name: "test-ts-client",
        defaultReleaseBranch: "main",
        specPath: "my-spec.json",
      }),
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
