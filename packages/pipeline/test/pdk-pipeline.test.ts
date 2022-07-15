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
