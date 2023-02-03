/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { GeneratedHtmlRedocDocs } from "../../../../../src/project/codegen/components/docs/generated-html-redoc-docs";
import { synthGeneratedCodeProject } from "../utils";

const synthDocs = (specFileName: string) => {
  const project = new Project({
    name: "parent",
  });
  return synthGeneratedCodeProject(specFileName, project, (specPath) => {
    new GeneratedHtmlRedocDocs(project, {
      specPath,
    });
  });
};

describe("GeneratedHtmlRedocDocs Unit Tests", () => {
  it("Single", () => {
    expect(synthDocs("single.yaml")).toHaveProperty(["html_redoc/index.html"]);
  });

  it("Multi", () => {
    expect(synthDocs("multi.yaml")).toHaveProperty(["html_redoc/index.html"]);
  });
});
