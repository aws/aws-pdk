/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { JavaProject } from "projen/lib/java";
import { SynthOutput } from "projen/lib/util/synth";
import { synthGeneratedCodeProject } from "./utils";
import { GeneratedJavaClientSourceCode } from "../../../../lib/project/codegen/components/generated-java-client-source-code";

const synthGeneratedCode = (specFileName: string): SynthOutput => {
  const project = new JavaProject({
    name: "test",
    artifactId: "com.aws.pdk.test",
    groupId: "test",
    version: "1.0.0",
  });
  return synthGeneratedCodeProject(specFileName, project, (specPath) => {
    new GeneratedJavaClientSourceCode(project, {
      specPath,
      invokeGenerator: true,
    });
  });
};

describe("Generated Java Client Code Unit Tests", () => {
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
    // TODO: Remove this validation and update mustache templates as appropriate when the following has been addressed:
    // https://github.com/OpenAPITools/openapi-generator/pull/14568
    expect(() =>
      synthGeneratedCode("multiple-tags.yaml")
    ).toThrowErrorMatchingSnapshot();
  });
});
