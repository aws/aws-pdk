/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { synthSnapshot } from "projen/lib/util/synth";
import { DocumentationFormat, OpenApiGatewayTsProject } from "../../../src";

describe("OpenAPI Gateway Ts With Docs Unit Tests", () => {
  it("With Docs", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
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
