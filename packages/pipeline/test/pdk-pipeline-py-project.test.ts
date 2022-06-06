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
import { SynthOutput, synthSnapshot } from "projen/lib/util/synth";
import { PDKPipelinePyProject } from "../src";

describe("PDK Pipeline Py Unit Tests", () => {
  it("Defaults", () => {
    const project = new PDKPipelinePyProject({
      authorEmail: "test@test.com",
      authorName: "test",
      moduleName: "defaults",
      version: "0.0.0",
      cdkVersion: "2.0.0",
      name: "Defaults",
    });
    expect(sanitizeOutput(synthSnapshot(project))).toMatchSnapshot();
  });

  it("projenrc synth correctly", () => {
    const project = new PDKPipelinePyProject(
      renderProjenInitOptions(
        "@aws-prototyping-sdk/pipeline.PDKPipelinePyProject",
        {
          authorEmail: "test@test.com",
          authorName: "test",
          moduleName: "defaults",
          version: "0.0.0",
          cdkVersion: "2.0.0",
          name: "ProjenRc",
        }
      )
    );
    expect(synthSnapshot(project)[".projenrc.py"]).toMatchSnapshot();
  });

  it("With Context", () => {
    const project = new PDKPipelinePyProject({
      authorEmail: "test@test.com",
      authorName: "test",
      moduleName: "with_context",
      version: "0.0.0",
      cdkVersion: "2.0.0",
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

    expect(sanitizeOutput(synthSnapshot(project))).toMatchSnapshot();
  });

  it("Custom AppEntrypoint", () => {
    const project = new PDKPipelinePyProject({
      authorEmail: "test@test.com",
      authorName: "test",
      moduleName: "custom_app_entrypoint",
      version: "0.0.0",
      cdkVersion: "2.0.0",
      name: "CustomAppEntrypoint",
      appEntrypoint: "updated.py",
    });
    expect(sanitizeOutput(synthSnapshot(project))).toMatchSnapshot();
  });
});

function sanitizeOutput(output: SynthOutput) {
  Object.keys(output)
    .filter((k) => k.includes("__pycache__"))
    .forEach((k) => delete output[k]);

  return output;
}
