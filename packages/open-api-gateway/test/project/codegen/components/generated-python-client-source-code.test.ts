/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PythonProject } from "projen/lib/python";
import { SynthOutput } from "projen/lib/util/synth";
import { synthGeneratedCodeProject } from "./utils";
import { GeneratedPythonClientSourceCode } from "../../../../lib/project/codegen/components/generated-python-client-source-code";

const synthGeneratedCode = (specFileName: string): SynthOutput => {
  const project = new PythonProject({
    name: "test",
    moduleName: "test",
    authorEmail: "me@example.com",
    authorName: "test",
    version: "1.0.0",
  });
  return synthGeneratedCodeProject(specFileName, project, (specPath) => {
    new GeneratedPythonClientSourceCode(project, {
      specPath,
      invokeGenerator: true,
    });
  });
};

describe("Generated Python Client Code Unit Tests", () => {
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
