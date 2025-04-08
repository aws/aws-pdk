/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { AwsPrototypingChecks, PDKNag } from "@aws/pdk-nag";
import { Stack, Stage } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { PDKPipeline, PDKPipelineWithCodeStarConnection } from "../src";

describe("PDK Pipeline Unit Tests", () => {
  const originalEnv = process.env;

  afterEach(() => {
    // Reset process.env after each test case
    process.env = originalEnv;
  });

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

  it("Defaults - using AwsPrototyping NagPack", () => {
    const app = PDKNag.app({ nagPacks: [new AwsPrototypingChecks()] });
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
    expect(app.nagResults().length).toEqual(0);
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("CrossAccount - using AwsPrototyping NagPack", () => {
    const app = PDKNag.app({ nagPacks: [new AwsPrototypingChecks()] });
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

  it("StageNagRuns - using AwsPrototyping NagPack", () => {
    const app = PDKNag.app({
      failOnError: false,
      nagPacks: [new AwsPrototypingChecks()],
    });
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

  it("Feature Branches", () => {
    delete process.env.BRANCH;
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "FeatureBranches", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "FeatureBranches",
      defaultBranchName: "mainline",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {},
      crossAccountKeys: false,
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

  it("Feature Branches - mainline", () => {
    process.env.BRANCH = "mainline";
    const app = PDKNag.app();
    const stack = new Stack(app);
    const branchPrefix = "";

    const pipeline = new PDKPipeline(stack, branchPrefix + "FeatureBranches", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "FeatureBranches",
      defaultBranchName: "mainline",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {},
      crossAccountKeys: false,
    });

    const stage = new Stage(app, branchPrefix + "Stage");
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

  it("Feature Branches - feature/new-feature_branch", () => {
    process.env.BRANCH = "feature/new-feature_branch";
    const app = PDKNag.app();
    const stack = new Stack(app);
    const branchPrefix = PDKPipeline.getBranchPrefix({ node: app.node });

    const pipeline = new PDKPipeline(stack, branchPrefix + "FeatureBranches", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "FeatureBranches",
      defaultBranchName: "mainline",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {},
      crossAccountKeys: false,
    });

    const stage = new Stage(app, branchPrefix + "Stage");
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

  it("Feature Branches - using AwsPrototyping NagPack", () => {
    delete process.env.BRANCH;
    const app = PDKNag.app({
      failOnError: false,
      nagPacks: [new AwsPrototypingChecks()],
    });
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "FeatureBranches", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "FeatureBranches",
      defaultBranchName: "mainline",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {},
      crossAccountKeys: false,
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

  it("Feature Branches - mainline - using AwsPrototyping NagPack", () => {
    process.env.BRANCH = "mainline";
    const app = PDKNag.app({
      failOnError: false,
      nagPacks: [new AwsPrototypingChecks()],
    });
    const stack = new Stack(app);
    const branchPrefix = "";

    const pipeline = new PDKPipeline(stack, branchPrefix + "FeatureBranches", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "FeatureBranches",
      defaultBranchName: "mainline",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {},
      crossAccountKeys: false,
    });

    const stage = new Stage(app, branchPrefix + "Stage");
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

  it("Feature Branches - feature/new-feature_branch - using AwsPrototyping NagPack", () => {
    process.env.BRANCH = "feature/new-feature_branch";
    const app = PDKNag.app({
      failOnError: false,
      nagPacks: [new AwsPrototypingChecks()],
    });
    const stack = new Stack(app);
    const branchPrefix = PDKPipeline.getBranchPrefix({ node: app.node });

    const pipeline = new PDKPipeline(stack, branchPrefix + "FeatureBranches", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "FeatureBranches",
      defaultBranchName: "mainline",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {},
      crossAccountKeys: false,
    });

    const stage = new Stage(app, branchPrefix + "Stage");
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

  it("PDKPipelineWithCodeStarConnection - using CodeStar Connection As Source", () => {
    delete process.env.BRANCH;
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipelineWithCodeStarConnection(
      stack,
      "PDKPipelineWithCodeStarConnectionDefaults",
      {
        codeStarConnectionArn:
          "arn:aws:codeconnections:us-west-2:123456789012:connection/abcdefghijk",
        repositoryOwnerAndName: "test/test",
        primarySynthDirectory: "cdk.out",
        synth: {},
        crossAccountKeys: false,
        sonarCodeScannerConfig: {
          sonarqubeAuthorizedGroup: "dev",
          sonarqubeDefaultProfileOrGateName: "dev",
          sonarqubeEndpoint: "https://sonar.dev",
          sonarqubeProjectName: "Default",
        },
      }
    );

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

  it("PDKPipelineWithCodeStarConnection - using AwsPrototyping NagPack", () => {
    const app = PDKNag.app({ nagPacks: [new AwsPrototypingChecks()] });
    const stack = new Stack(app);

    const pipeline = new PDKPipelineWithCodeStarConnection(
      stack,
      "PDKPipelineWithCodeStarAwsPrototypingNagPack",
      {
        codeStarConnectionArn:
          "arn:aws:codeconnections:us-west-2:123456789012:connection/abcdefghijk",
        repositoryOwnerAndName: "test/test",
        defaultBranchName: "main",
        primarySynthDirectory: "cdk.out",
        synth: {},
        crossAccountKeys: false,
        sonarCodeScannerConfig: {
          sonarqubeAuthorizedGroup: "dev",
          sonarqubeDefaultProfileOrGateName: "dev",
          sonarqubeEndpoint: "https://sonar.dev",
          sonarqubeProjectName: "Default",
        },
      }
    );

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

  it("PDKPipelineWithCodeStarConnection - CrossAccount", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipelineWithCodeStarConnection(
      stack,
      "PDKPipelineWithCodeStarConnectionCrossAccount",
      {
        codeStarConnectionArn:
          "arn:aws:codeconnections:us-west-2:123456789012:connection/abcdefghijk",
        repositoryOwnerAndName: "test/test",
        primarySynthDirectory: "cdk.out",
        synth: {},
        crossAccountKeys: true,
        sonarCodeScannerConfig: {
          sonarqubeAuthorizedGroup: "dev",
          sonarqubeDefaultProfileOrGateName: "dev",
          sonarqubeEndpoint: "https://sonar.dev",
          sonarqubeProjectName: "Default",
        },
      }
    );

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
});
