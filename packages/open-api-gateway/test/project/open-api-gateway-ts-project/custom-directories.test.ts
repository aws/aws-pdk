/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { synthSnapshot } from "projen/lib/util/synth";
import { ClientLanguage, OpenApiGatewayTsProject } from "../../../src";

describe("OpenAPI Gateway Ts Custom Directories Unit Tests", () => {
  it("With Custom Directories And File Names", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [ClientLanguage.TYPESCRIPT],
      sampleCode: false,
      specFile: "specification/openapi.yaml",
      parsedSpecFileName: "parsed-openapi.json",
      generatedCodeDir: "gen",
      srcdir: "source",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Throws With Non JSON Parsed Spec File Name", () => {
    expect(
      () =>
        new OpenApiGatewayTsProject({
          defaultReleaseBranch: "mainline",
          name: "@test/my-api",
          clientLanguages: [ClientLanguage.TYPESCRIPT],
          sampleCode: false,
          parsedSpecFileName: "parsed-openapi.yaml",
        })
    ).toThrow("Parsed spec file must end with .json");
  });
});
