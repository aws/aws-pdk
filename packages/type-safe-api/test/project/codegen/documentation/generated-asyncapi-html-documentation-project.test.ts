/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedAsyncApiHtmlDocumentationProject } from "../../../../src/project/codegen/documentation/generated-asyncapi-html-documentation-project";
import { synthProject } from "../../snapshot-utils";

describe("GeneratedAsyncApiHtmlDocumentationProject Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedAsyncApiHtmlDocumentationProject({
      outdir: path.resolve(__dirname, "asyncapi-html-docs"),
      name: "docs",
      specPath: "my-asyncapi-spec.json",
    });
    expect(synthProject(project)).toMatchSnapshot();
  });
});
