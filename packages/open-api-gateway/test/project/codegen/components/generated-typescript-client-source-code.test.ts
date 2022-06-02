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
import * as path from "path";
import * as fs from "fs-extra";
import { Project } from "projen";
import { directorySnapshot } from "projen/lib/util/synth";
import { GeneratedTypescriptClientSourceCode } from "../../../../src/project/codegen/components/generated-typescript-client-source-code";
import { ParsedSpec } from "../../../../src/project/spec/components/parsed-spec";

const synthGeneratedCode = (specFileName: string) => {
  const project = new Project({
    name: "test",
  });
  try {
    const parsedSpecPath = path.join(project.outdir, "spec.json");
    new ParsedSpec(project, {
      specPath: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "resources",
        "specs",
        specFileName
      ),
      outputPath: parsedSpecPath,
    });
    new GeneratedTypescriptClientSourceCode(project, {
      specPath: parsedSpecPath,
    });
    project.synth();
    return directorySnapshot(project.outdir, {
      excludeGlobs: ["**/spec.json"],
    });
  } finally {
    fs.removeSync(project.outdir);
  }
};

describe("Generated Typescript Client Code Unit Tests", () => {
  it("Single", () => {
    expect(synthGeneratedCode("single.yaml")).toMatchSnapshot();
  });

  it("Multi", () => {
    expect(synthGeneratedCode("multi.yaml")).toMatchSnapshot();
  });
});
