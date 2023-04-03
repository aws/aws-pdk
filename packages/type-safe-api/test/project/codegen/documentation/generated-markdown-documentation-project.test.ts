/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedMarkdownDocumentationProject } from "../../../../src/project/codegen/documentation/generated-markdown-documentation-project";
import { synthProject } from "../../snapshot-utils";

describe("GeneratedMarkdownDocumentationProject Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedMarkdownDocumentationProject({
      outdir: path.resolve(__dirname, "markdown-docs"),
      name: "docs",
      specPath: "my-spec.json",
    });
    expect(synthProject(project)).toMatchSnapshot();
  });
});
