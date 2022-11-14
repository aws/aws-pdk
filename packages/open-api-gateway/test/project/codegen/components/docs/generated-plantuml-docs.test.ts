/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { GeneratedPlantUmlDocs } from "../../../../../src/project/codegen/components/docs/generated-plantuml-docs";
import { synthGeneratedCodeProject } from "../utils";

const synthDocs = (specFileName: string) => {
  const project = new Project({
    name: "parent",
  });
  return synthGeneratedCodeProject(specFileName, project, (specPath) => {
    new GeneratedPlantUmlDocs(project, {
      specPath,
    });
  });
};

describe("GeneratedPlantUmlDocs Unit Tests", () => {
  it("Single", () => {
    expect(synthDocs("single.yaml")).toMatchSnapshot();
  });

  it("Multi", () => {
    expect(synthDocs("multi.yaml")).toMatchSnapshot();
  });
});
