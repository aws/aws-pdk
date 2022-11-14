/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { Stack, Stage } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { PDKPipeline } from "../src";

describe("PDK Pipeline Unit Tests", () => {
  it("Defaults", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "Defaults", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "Defaults",
      synth: {},
      crossAccountKeys: false,
      sonarCodeScannerConfig: {
        sonarqubeAuthorizedGroup: "dev",
        sonarqubeDefaultProfileOrGateName: "dev",
        sonarqubeEndpoint: "https://sonar.dev",
        sonarqubeProjectName: "Default",
      },
    });

    const stage = new Stage(app, "Stage");
    const appStack = new Stack(stage, "AppStack");
    new Asset(appStack, "Asset", {
      path: path.join(__dirname, "pdk-pipeline.test.ts"),
    });

    pipeline.addStage(stage);
    pipeline.buildPipeline();

    app.synth();
    expect(app.nagResults().length).toEqual(0);
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("CrossAccount", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "CrossAccount", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "Defaults",
      synth: {},
      crossAccountKeys: true,
      sonarCodeScannerConfig: {
        sonarqubeAuthorizedGroup: "dev",
        sonarqubeDefaultProfileOrGateName: "dev",
        sonarqubeEndpoint: "https://sonar.dev",
        sonarqubeProjectName: "Default",
      },
    });

    const stage = new Stage(app, "Stage");
    const appStack = new Stack(stage, "AppStack");
    new Asset(appStack, "Asset", {
      path: path.join(__dirname, "pdk-pipeline.test.ts"),
    });

    pipeline.addStage(stage);
    pipeline.buildPipeline();

    app.synth();
    console.log(JSON.stringify(app.nagResults()));
    expect(app.nagResults().length).toEqual(0);
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("StageNagRuns", () => {
    const app = PDKNag.app({ failOnError: false });
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "StageNagRuns", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "StageNagRuns",
      synth: {},
      sonarCodeScannerConfig: {
        sonarqubeAuthorizedGroup: "dev",
        sonarqubeDefaultProfileOrGateName: "dev",
        sonarqubeEndpoint: "https://sonar.dev",
        sonarqubeProjectName: "Default",
      },
    });

    const stage = new Stage(app, "Stage");
    const appStack = new Stack(stage, "AppStack");
    new Bucket(appStack, "Non-Compliant");

    pipeline.addStage(stage);
    pipeline.buildPipeline();

    app.synth();

    expect(app.nagResults()[0].resource).toEqual(
      "Stage/AppStack/Non-Compliant/Resource"
    );
  });
});
