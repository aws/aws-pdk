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

import { renderProjenInitOptions } from "projen/lib/javascript/render-options";
import { synthSnapshot } from "projen/lib/util/synth";
import { PDKPipelineTsProject } from "../src";

describe("PDK Pipeline TS Unit Tests", () => {
  it("Defaults", () => {
    const project = new PDKPipelineTsProject({
      cdkVersion: "2.0.0",
      defaultReleaseBranch: "mainline",
      name: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("projenrc synth correctly", () => {
    const project = new PDKPipelineTsProject(
      renderProjenInitOptions(
        "@aws-prototyping-sdk/pipeline.PDKPipelineTsProject",
        {
          cdkVersion: "2.0.0",
          defaultReleaseBranch: "mainline",
          name: "ProjenRc",
        }
      )
    );
    expect(synthSnapshot(project)[".projenrc.ts"]).toMatchSnapshot();
  });

  it("With Context", () => {
    const project = new PDKPipelineTsProject({
      cdkVersion: "2.0.0",
      defaultReleaseBranch: "mainline",
      name: "WithContext",
      context: {
        sonarqubeScannerConfig: {
          sonarqubeEndpoint: "https://my.endpoint",
          sonarqubeAuthorizedGroup: "group",
          sonarqubeDefaultProfileOrGateName: "default",
          sonarqubeSpecificProfileOrGateName: "specific",
          sonarqubeProjectName: "WithContext",
          sonarqubeTags: ["sample"],
          preArchiveCommands: ["echo here"],
        },
      },
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Custom AppEntrypoint", () => {
    const project = new PDKPipelineTsProject({
      cdkVersion: "2.0.0",
      defaultReleaseBranch: "mainline",
      name: "CustomAppEntrypoint",
      appEntrypoint: "updated.ts",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
