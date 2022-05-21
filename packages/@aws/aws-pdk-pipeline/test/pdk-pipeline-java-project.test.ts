// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { renderProjenInitOptions } from "projen/lib/javascript/render-options";
import { synthSnapshot } from "projen/lib/util/synth";
import { PDKPipelineJavaProject } from "../src";

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

  it("projenrc synth correctly", () => {
    const project = new PDKPipelineJavaProject(
      renderProjenInitOptions("@aws/aws-pdk-pipeline.PDKPipelineJavaProject", {
        artifactId: "test",
        cdkVersion: "2.0.0",
        groupId: "test",
        mainClass: "software.aws.Pipeline",
        version: "0.0.0",
        name: "ProjenRc",
      })
    );
    expect(
      synthSnapshot(project)["src/test/java/projenrc.java"]
    ).toMatchSnapshot();
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
