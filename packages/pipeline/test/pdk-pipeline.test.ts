/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { AwsPrototypingChecks, PDKNag } from "@aws/pdk-nag";
import { Stack, Stage } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { PDKPipeline } from "../src";

describe("PDK Pipeline Unit Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws error when neither repositoryName nor codestarConnectionArn is provided", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    expect(() => {
      new PDKPipeline(stack, "InvalidConfig", {
        primarySynthDirectory: "cdk.out",
        synth: {
          commands: ["npx projen build"],
        },
        crossAccountKeys: false,
      });
    }).toThrow(
      "Either repositoryName or codestarConnectionArn must be provided"
    );
  });

  it("throws error when codestarConnectionArn is provided without repositoryOwnerAndName", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    expect(() => {
      new PDKPipeline(stack, "InvalidCodeStarConfig", {
        primarySynthDirectory: "cdk.out",
        codestarConnectionArn:
          "arn:aws:codestar-connections:region:account:connection/uuid",
        synth: {
          commands: ["npx projen build"],
        },
        crossAccountKeys: false,
      });
    }).toThrow(
      "repositoryOwnerAndName is required when using codestarConnectionArn"
    );
  });

  it("CodeCommit Source - Defaults", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "Defaults", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "Defaults",
      synth: {
        commands: ["npx projen build"],
      },
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

  it("CodeStar Connection Source - Defaults", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "CodeStarDefaults", {
      primarySynthDirectory: "cdk.out",
      codestarConnectionArn:
        "arn:aws:codestar-connections:region:account:connection/uuid",
      repositoryOwnerAndName: "owner/repo",
      synth: {
        commands: ["npx projen build"],
      },
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
      synth: {
        commands: ["npx projen build"],
      },
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
      synth: {
        commands: ["npx projen build"],
      },
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

  it("CrossAccount - CodeStar Connection", () => {
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "CrossAccountCodeStar", {
      primarySynthDirectory: "cdk.out",
      codestarConnectionArn:
        "arn:aws:codestar-connections:region:account:connection/uuid",
      repositoryOwnerAndName: "owner/repo",
      synth: {
        commands: ["npx projen build"],
      },
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

  it("Feature Branches - CodeCommit", () => {
    delete process.env.BRANCH;
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "FeatureBranches", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "FeatureBranches",
      defaultBranchName: "mainline",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {
        commands: ["npx projen build"],
      },
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

  it("Feature Branches - CodeStar Connection", () => {
    delete process.env.BRANCH;
    const app = PDKNag.app();
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "FeatureBranchesCodeStar", {
      primarySynthDirectory: "cdk.out",
      codestarConnectionArn:
        "arn:aws:codestar-connections:region:account:connection/uuid",
      repositoryOwnerAndName: "owner/repo",
      defaultBranchName: "main",
      branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
      synth: {
        commands: ["npx projen build"],
      },
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

  it("StageNagRuns", () => {
    const app = PDKNag.app({ failOnError: false });
    const stack = new Stack(app);

    const pipeline = new PDKPipeline(stack, "StageNagRuns", {
      primarySynthDirectory: "cdk.out",
      repositoryName: "StageNagRuns",
      synth: {
        commands: ["npx projen build"],
      },
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
      synth: {
        commands: ["npx projen build"],
      },
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
    new Bucket(appStack, "Non-Compliant");

    pipeline.addStage(stage);
    pipeline.buildPipeline();

    app.synth();

    expect(app.nagResults()[0].resource).toEqual(
      "Stage/AppStack/Non-Compliant/Resource"
    );
  });
});
