/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedAsyncApiMarkdownDocumentationProject } from "../../../../src/project/codegen/documentation/generated-asyncapi-markdown-documentation-project";
import { synthProject } from "../../snapshot-utils";

describe("GeneratedAsyncApiMarkdownDocumentationProject Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedAsyncApiMarkdownDocumentationProject({
      outdir: path.resolve(__dirname, "asyncapi-markdown-docs"),
      name: "docs",
      specPath: "my-asyncapi-spec.json",
    });
    expect(synthProject(project)).toMatchSnapshot();
  });
});
