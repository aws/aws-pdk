// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { synthSnapshot } from "projen/lib/util/synth";
import { PDKPipelinePyProject } from "../../src/pdk_projen";

describe("PDK Pipeline Py Unit Tests", () => {
  it("Defaults", () => {
    const project = new PDKPipelinePyProject({
      authorEmail: "test@test.com",
      authorName: "test",
      moduleName: "with_context",
      version: "0.0.0",
      cdkVersion: "2.0.0",
      name: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
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
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Custom AppEntrypoint", () => {
    const project = new PDKPipelinePyProject({
      authorEmail: "test@test.com",
      authorName: "test",
      moduleName: "with_context",
      version: "0.0.0",
      cdkVersion: "2.0.0",
      name: "CustomAppEntrypoint",
      appEntrypoint: "updated.py",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
