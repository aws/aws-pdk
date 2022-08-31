/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
import { TypeScriptProject } from "projen/lib/typescript";
import { SynthOutput } from "projen/lib/util/synth";
import { GeneratedTypescriptClientSourceCode } from "../../../../src/project/codegen/components/generated-typescript-client-source-code";
import { synthGeneratedCodeProject } from "./utils";

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
});
