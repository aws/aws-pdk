/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
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
