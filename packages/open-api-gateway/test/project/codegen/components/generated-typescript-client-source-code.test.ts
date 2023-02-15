/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeScriptProject } from "projen/lib/typescript";
import { SynthOutput } from "projen/lib/util/synth";
import { synthGeneratedCodeProject } from "./utils";
import { GeneratedTypescriptClientSourceCode } from "../../../../src/project/codegen/components/generated-typescript-client-source-code";

const synthGeneratedCode = (specFileName: string): SynthOutput => {
  const project = new TypeScriptProject({
    name: "test",
    defaultReleaseBranch: "main",
  });
  return synthGeneratedCodeProject(specFileName, project, (specPath) => {
    new GeneratedTypescriptClientSourceCode(project, {
      specPath,
      invokeGenerator: true,
    });
  });
};

describe("Generated Typescript Client Code Unit Tests", () => {
  it("Single", () => {
    expect(synthGeneratedCode("single.yaml")).toMatchSnapshot();
  });

  it("Multi", () => {
    expect(synthGeneratedCode("multi.yaml")).toMatchSnapshot();
  });

  it("Single Tags", () => {
    expect(synthGeneratedCode("single-tags.yaml")).toMatchSnapshot();
  });

  it("Multiple Tags", () => {
    expect(synthGeneratedCode("multiple-tags.yaml")).toMatchSnapshot();
  });
});
