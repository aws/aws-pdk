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
import { Project } from "projen";
import { GeneratedHtml2Docs } from "../../../../../src/project/codegen/components/docs/generated-html2-docs";
import { synthGeneratedCodeProject } from "../utils";

const synthDocs = (specFileName: string) => {
  const project = new Project({
    name: "parent",
  });
  return synthGeneratedCodeProject(specFileName, project, (specPath) => {
    new GeneratedHtml2Docs(project, {
      specPath,
    });
  });
};

describe("GeneratedHtml2Docs Unit Tests", () => {
  it("Single", () => {
    expect(synthDocs("single.yaml")).toMatchSnapshot();
  });

  it("Multi", () => {
    expect(synthDocs("multi.yaml")).toMatchSnapshot();
  });
});
