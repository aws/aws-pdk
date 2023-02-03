/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { synthSnapshot } from "projen/lib/util/synth";
import { OpenApiGatewayPythonProject, DocumentationFormat } from "../../../src";

describe("OpenAPI Gateway Python With Docs Unit Tests", () => {
  it("With Docs", () => {
    const project = new OpenApiGatewayPythonProject({
      moduleName: "my_api",
      name: "my_api",
      authorName: "test",
      authorEmail: "test@example.com",
      version: "1.0.0",
      clientLanguages: [],
      documentationFormats: [
        DocumentationFormat.HTML2,
        DocumentationFormat.MARKDOWN,
        DocumentationFormat.PLANTUML,
      ],
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
