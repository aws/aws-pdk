// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import {
  CodePipeline,
  CodePipelineProps,
  CodePipelineSource,
  ShellStep,
  ShellStepProps,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import {
  SonarCodeScanner,
  SonarCodeScannerConfig,
} from "./code_scanner/sonar-code-scanner";

export * from "./code_scanner/sonar-code-scanner";

const DEFAULT_BRANCH_NAME = "mainline";

/**
 * Properties to configure the PDKPipeline.
 *
 * Note: Due to limitations with JSII and generic support it should be noted that
 * the synth, synthShellStepPartialProps.input and
 * synthShellStepPartialProps.primaryOutputDirectory properties will be ignored
 * if passed in to this construct.
 *
 * synthShellStepPartialProps.commands is marked as a required field, however
 * if you pass in [] the default commands of this construct will be retained.
 */
export interface PDKPipelineProps extends CodePipelineProps {
  /**
   * Enables a build job to trigger on PR merges to the defaultBranchName. This
   * will automatically build the codebase and add an Approval to the PR on
   * successful build.
   *
   * @default true
   */
  readonly prBuildChecker?: boolean;

  /**
   * Name of the CodeCommit repository to create.
   */
  readonly repositoryName: string;

  /**
   * Output directory for cdk synthesized artifacts i.e: packages/infra/cdk.out.
   */
  readonly primarySynthDirectory: string;

  /**
   * PDKPipeline by default assumes a NX Monorepo structure for it's codebase and
   * uses sane defaults for the install and run commands. To override these defaults
   * and/or provide additional inputs, specify env settings, etc you can provide
   * a partial ShellStepProps.
   */
  readonly synthShellStepPartialProps?: ShellStepProps;

  /**
   * Branch to trigger the pipeline execution.
   *
   * @default mainline
   */
  readonly defaultBranchName?: string;

  /**
   * Configuration for enabling Sonarqube code scanning.
   *
   * @default undefined
   */
  readonly sonarCodeScannerConfig?: SonarCodeScannerConfig;

  /**
   * Possible values for a resource's Removal Policy
   * The removal policy controls what happens to the resource if it stops being managed by CloudFormation.
   */
  readonly codeCommitRemovalPolicy?: RemovalPolicy;
}

/**
 * An extension to CodePipeline which configures sane defaults for a NX Monorepo
 * codebase. In addition to this, it also creates a CodeCommit repository with
 * automated PR builds and approvals.
 */
export class PDKPipeline extends CodePipeline {
  readonly codeRepository: Repository;
  private readonly sonarCodeScannerConfig?: SonarCodeScannerConfig;

  public constructor(scope: Construct, id: string, props: PDKPipelineProps) {
    const codeRepository = new Repository(scope, "CodeRepository", {
      repositoryName: props.repositoryName,
    });
    codeRepository.applyRemovalPolicy(
      props.codeCommitRemovalPolicy ?? RemovalPolicy.RETAIN
    );

    // TODO: Implement prBuildChecker

    // ignore input and primaryOutputDirectory
    const {
      input,
      primaryOutputDirectory,
      commands,
      ...synthShellStepPartialProps
    } = props.synthShellStepPartialProps || {};

    const codePipelineProps: CodePipelineProps = {
      ...props,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.codeCommit(
          codeRepository,
          props.defaultBranchName || DEFAULT_BRANCH_NAME
        ),
        installCommands: ["yarn install --frozen-lockfile"],
        commands:
          commands && commands.length > 0
            ? commands
            : ["npx nx run-many --target=build --all"],
        primaryOutputDirectory: props.primarySynthDirectory,
        ...(synthShellStepPartialProps || {}),
      }),
    };

    super(scope, id, codePipelineProps);

    this.codeRepository = codeRepository;
    this.sonarCodeScannerConfig = props.sonarCodeScannerConfig;

    new CfnOutput(scope, "CodeRepositoryGRCUrl", {
      exportName: "CodeRepositoryGRCUrl",
      value: this.codeRepository.repositoryCloneUrlGrc,
    });
  }

  buildPipeline() {
    super.buildPipeline();

    this.sonarCodeScannerConfig &&
      new SonarCodeScanner(this, "SonarCodeScanner", {
        artifactBucketArn: this.pipeline.artifactBucket.bucketArn,
        artifactBucketKeyArn:
          this.pipeline.artifactBucket.encryptionKey?.keyArn,
        synthBuildArn: this.synthProject.projectArn,
        ...this.sonarCodeScannerConfig,
      });
  }
}
