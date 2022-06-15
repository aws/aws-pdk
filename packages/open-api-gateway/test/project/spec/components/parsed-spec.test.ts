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
import { ParsedSpec } from "../../../../src/project/spec/components/parsed-spec";

const synthParsedSpec = (specFileName: string) => {
  const project = new Project({
    name: "test",
  });
  try {
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
      outputPath: path.join(project.outdir, "spec.json"),
    });
    project.synth();
    return directorySnapshot(project.outdir);
  } finally {
    fs.removeSync(project.outdir);
  }
};

describe("Parsed Spec Unit Tests", () => {
  it("Single", () => {
    expect(synthParsedSpec("single.yaml")).toMatchSnapshot();
  });

  it("Multi", () => {
    expect(synthParsedSpec("multi.yaml")).toMatchSnapshot();
  });
});
