/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedHtml2DocumentationProject } from "../../../../src/project/codegen/documentation/generated-html2-documentation-project";
import { synthProject } from "../../snapshot-utils";

describe("GeneratedHtml2DocumentationProject Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedHtml2DocumentationProject({
      outdir: path.resolve(__dirname, "html2-docs"),
      name: "docs",
      specPath: "my-spec.json",
    });
    expect(synthProject(project)).toMatchSnapshot();
  });
});
