/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedTypescriptAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-typescript-async-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Typescript Async Runtime Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedTypescriptAsyncRuntimeProject({
      outdir: path.resolve(__dirname, "ts-async-runtime"),
      name: "test-ts-runtime",
      defaultReleaseBranch: "main",
      specPath: "my-spec.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
