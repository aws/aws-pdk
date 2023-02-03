/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { synthSnapshot } from "projen/lib/util/synth";
import { OpenApiGatewayJavaProject, DocumentationFormat } from "../../../src";

describe("OpenAPI Gateway Java With Docs Unit Tests", () => {
  it("With Docs", () => {
    const project = new OpenApiGatewayJavaProject({
      name: "myapi",
      groupId: "software.aws.test",
      artifactId: "my-api",
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
