// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
