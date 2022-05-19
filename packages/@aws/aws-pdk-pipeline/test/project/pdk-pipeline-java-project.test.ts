// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { synthSnapshot } from "projen/lib/util/synth";
import { PDKPipelineJavaProject } from "../../src/project";

describe("PDK Pipeline Java Unit Tests", () => {
  it("Defaults", () => {
    const project = new PDKPipelineJavaProject({
      artifactId: "test",
      cdkVersion: "2.0.0",
      groupId: "test",
      mainClass: "software.aws.Pipeline",
      version: "0.0.0",
      name: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("With Context", () => {
    const project = new PDKPipelineJavaProject({
      artifactId: "test",
      cdkVersion: "2.0.0",
      groupId: "test",
      mainClass: "software.aws.Pipeline",
      version: "0.0.0",
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
});
