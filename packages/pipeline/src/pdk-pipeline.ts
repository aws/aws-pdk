/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Aspects, CfnOutput, RemovalPolicy, Stage } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { Key } from "aws-cdk-lib/aws-kms";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import {
  AddStageOpts,
  CodePipeline,
  CodePipelineProps,
  CodePipelineSource,
  ShellStep,
  ShellStepProps,
  StageDeployment,
} from "aws-cdk-lib/pipelines";
import { NagSuppressions } from "cdk-nag";
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
   * Configuration for enabling Sonarqube code scanning on a successful synth.
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
export class PDKPipeline extends Construct {
  readonly codePipeline: CodePipeline;
  readonly codeRepository: Repository;
  private readonly sonarCodeScannerConfig?: SonarCodeScannerConfig;

  public constructor(scope: Construct, id: string, props: PDKPipelineProps) {
    super(scope, id);

    this.node.setContext(
      "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy",
      true
    );

    const codeRepository = new Repository(this, "CodeRepository", {
      repositoryName: props.repositoryName,
    });
    codeRepository.applyRemovalPolicy(
      props.codeCommitRemovalPolicy ?? RemovalPolicy.RETAIN
    );

    const accessLogsBucket = new Bucket(this, "AccessLogsBucket", {
      versioned: false,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    const artifactBucket = new Bucket(this, "ArtifactsBucket", {
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: props.crossAccountKeys
        ? BucketEncryption.KMS
        : BucketEncryption.S3_MANAGED,
      encryptionKey: props.crossAccountKeys
        ? new Key(this, "ArtifactKey", {
            enableKeyRotation: true,
            removalPolicy: RemovalPolicy.DESTROY,
          })
        : undefined,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsPrefix: "access-logs",
      serverAccessLogsBucket: accessLogsBucket,
    });

    const codePipeline = new Pipeline(this, "CodePipeline", {
      enableKeyRotation: props.crossAccountKeys,
      restartExecutionOnUpdate: true,
      crossAccountKeys: props.crossAccountKeys,
      artifactBucket,
    });

    // ignore input and primaryOutputDirectory
    const {
      input,
      primaryOutputDirectory,
      commands,
      ...synthShellStepPartialProps
    } = props.synthShellStepPartialProps || {};

    const synthShellStep = new ShellStep("Synth", {
      input: CodePipelineSource.codeCommit(
        codeRepository,
        props.defaultBranchName || DEFAULT_BRANCH_NAME
      ),
      installCommands: [
        "npm install -g aws-cdk",
        "yarn install --frozen-lockfile || npx projen && yarn install --frozen-lockfile",
      ],
      commands:
        commands && commands.length > 0
          ? commands
          : ["npx nx run-many --target=build --all"],
      primaryOutputDirectory: props.primarySynthDirectory,
      ...(synthShellStepPartialProps || {}),
    });

    synthShellStep.addOutputDirectory(".");

    const codePipelineProps: CodePipelineProps = {
      codePipeline,
      ...props,
      crossAccountKeys: undefined,
      synth: synthShellStep,
    };

    this.codePipeline = new CodePipeline(this, id, codePipelineProps);
    this.codeRepository = codeRepository;
    this.sonarCodeScannerConfig = props.sonarCodeScannerConfig
      ? {
          cdkOutDir: props.primarySynthDirectory,
          ...props.sonarCodeScannerConfig,
        }
      : undefined;

    new CfnOutput(this, "CodeRepositoryGRCUrl", {
      value: this.codeRepository.repositoryCloneUrlGrc,
    });
  }

  /**
   * @inheritDoc
   */
  addStage(stage: Stage, options?: AddStageOpts): StageDeployment {
    // Add any root Aspects to the stage level as currently this doesn't happen automatically
    Aspects.of(stage.node.root).all.forEach((aspect) =>
      Aspects.of(stage).add(aspect)
    );
    return this.codePipeline.addStage(stage, options);
  }

  buildPipeline() {
    this.codePipeline.buildPipeline();

    this.sonarCodeScannerConfig &&
      new SonarCodeScanner(this, "SonarCodeScanner", {
        artifactBucketArn: this.codePipeline.pipeline.artifactBucket.bucketArn,
        artifactBucketKeyArn:
          this.codePipeline.pipeline.artifactBucket.encryptionKey?.keyArn,
        synthBuildArn: this.codePipeline.synthProject.projectArn,
        ...this.sonarCodeScannerConfig,
      });

    this.suppressCDKViolations();
  }

  suppressCDKViolations() {
    this.suppressRules(
      ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"],
      "Wildcards are needed for dynamically created resources."
    );

    this.suppressRules(
      [
        "AwsSolutions-CB4",
        "AwsPrototyping-CodeBuildProjectKMSEncryptedArtifacts",
      ],
      "Encryption of Codebuild is not required."
    );

    this.suppressRules(
      ["AwsSolutions-S1", "AwsPrototyping-S3BucketLoggingEnabled"],
      "Access Log buckets should not have s3 bucket logging"
    );
  }

  private suppressRules(rules: string[], reason: string) {
    NagSuppressions.addResourceSuppressions(
      this,
      rules.map((r) => ({
        id: r,
        reason,
      })),
      true
    );
  }
}
