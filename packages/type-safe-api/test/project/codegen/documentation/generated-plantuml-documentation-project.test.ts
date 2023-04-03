/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedPlantumlDocumentationProject } from "../../../../src/project/codegen/documentation/generated-plantuml-documentation-project";
import { synthProject } from "../../snapshot-utils";

describe("GeneratedPlantumlDocumentationProject Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedPlantumlDocumentationProject({
      outdir: path.resolve(__dirname, "plantuml-docs"),
      name: "docs",
      specPath: "my-spec.json",
    });
    expect(synthProject(project)).toMatchSnapshot();
  });
});
