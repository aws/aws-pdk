/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedHtmlRedocDocumentationProject } from "../../../../src/project/codegen/documentation/generated-html-redoc-documentation-project";
import { synthProject } from "../../snapshot-utils";

describe("GeneratedHtmlRedocDocumentationProject Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedHtmlRedocDocumentationProject({
      outdir: path.resolve(__dirname, "html-redoc-docs"),
      name: "docs",
      specPath: "my-spec.json",
    });
    expect(synthProject(project)).toMatchSnapshot();
  });
});
