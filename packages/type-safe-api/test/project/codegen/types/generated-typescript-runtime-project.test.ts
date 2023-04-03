/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedTypescriptRuntimeProject } from "../../../../src/project/codegen/runtime/generated-typescript-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Typescript Runtime Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedTypescriptRuntimeProject({
      outdir: path.resolve(__dirname, "ts-runtime"),
      name: "test-ts-runtime",
      defaultReleaseBranch: "main",
      specPath: "my-spec.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
