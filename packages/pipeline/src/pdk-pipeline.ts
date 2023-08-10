/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  Aspects,
  CfnOutput,
  RemovalPolicy,
  Stack,
  Stage,
  Tags,
} from "aws-cdk-lib";
import { IRepository, Repository } from "aws-cdk-lib/aws-codecommit";
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
import { Construct, Node } from "constructs";
import {
  SonarCodeScanner,
  SonarCodeScannerConfig,
} from "./code_scanner/sonar-code-scanner";
import { FeatureBranches } from "./feature-branches";

export * from "./code_scanner/sonar-code-scanner";

export const DEFAULT_BRANCH_NAME = "mainline";

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

  /**
   * Branch name prefixes
   * Any branches created matching this list of prefixes will create a new pipeline and stack.
   *
   * @example
   * // Creates a new pipeline and stack for any branch
   * new PDKPipeline(this, 'PDKPipeline', {
   *   repositoryName: 'my-repo',
   *   branchNamePrefixes: PDKPipeline.ALL_BRANCHES,
   * }
   * @example
   * // Creates a new pipeline and stack for any branch starting with 'feature/' or 'fix/'
   * new PDKPipeline(this, 'PDKPipeline', {
   *   repositoryName: 'my-repo',
   *   branchNamePrefixes: ['feature/', 'fix/'],
   * }
   * @example
   * // Disables feature branches (default)
   * new PDKPipeline(this, 'PDKPipeline', {
   *   repositoryName: 'my-repo',
   *   branchNamePrefixes: [], // or simply exclude this line
   * }
   * @default undefined
   */
  readonly branchNamePrefixes?: string[];

  /**
   * CDK command. Override the command used to call cdk for synth and deploy.
   *
   * @default 'npx cdk'
   */
  readonly cdkCommand?: string;
}

/**
 * Properties to help the isDefaultBranch function determine the default branch name.
 */
export interface IsDefaultBranchProps {
  /**
   * The current node to fetch defaultBranchName from context.
   */
  readonly node?: Node;

  /**
   * Specify the default branch name without context.
   */
  readonly defaultBranchName?: string;
}

/**
 * An extension to CodePipeline which configures sane defaults for a NX Monorepo
 * codebase. In addition to this, it also creates a CodeCommit repository with
 * automated PR builds and approvals.
 */
export class PDKPipeline extends Construct {
  static readonly ALL_BRANCHES = [""];
  static readonly defaultBranchName = DEFAULT_BRANCH_NAME;

  /**
   * A helper function to normalize the branch name with only alphanumeric characters and hypens ('-').
   * @param branchName The name of the branch to normalize.
   * @returns The normalized branch name.
   */
  public static normalizeBranchName(branchName: string): string {
    return branchName.replace(/[^a-zA-Z0-9-]/g, "-");
  }

  /**
   * A helper function to determine if the current branch is the default branch.
   *
   * If there is no BRANCH environment variable, then assume this is the default
   * branch. Otherwise, check that BRANCH matches the default branch name.
   *
   * The default branch name is determined in the following priority:
   *
   * 1. defaultBranchName property
   * 2. defaultBranchName context
   * 3. PDKPipeline.defaultBranchName constant
   *
   * @param props? {
   *    defaultBranchName? Specify the default branch name without context.
   *    node? The current app to fetch defaultBranchName from context.
   * }
   * @returns True if the current branch is the default branch.
   */
  public static isDefaultBranch(
    props: IsDefaultBranchProps = {
      defaultBranchName: undefined,
      node: undefined,
    }
  ): boolean {
    if (!process.env.BRANCH) {
      return true;
    }
    const defaultBranchName: string =
      props.defaultBranchName ||
      (props.node && props.node.tryGetContext("defaultBranchName")) ||
      PDKPipeline.defaultBranchName;
    return defaultBranchName === process.env.BRANCH;
  }

  /**
   * A helper function to create a branch prefix. The prefix is empty on the default branch.
   * @param props? {
   *    defaultBranchName? Specify the default branch name without context.
   *    node? The current app to fetch defaultBranchName from context.
   * }
   * @returns The branch prefix.
   */
  public static getBranchPrefix(
    props: IsDefaultBranchProps = {
      defaultBranchName: undefined,
      node: undefined,
    }
  ): string {
    return PDKPipeline.isDefaultBranch(props)
      ? ""
      : PDKPipeline.normalizeBranchName(process.env.BRANCH!) + "-";
  }

  readonly codePipeline: CodePipeline;
  readonly codeRepository: IRepository;
  private readonly sonarCodeScannerConfig?: SonarCodeScannerConfig;
  private readonly branchNamePrefixes?: string[];
  private readonly defaultBranchName?: string;
  private readonly repositoryName: string;

  public constructor(scope: Construct, id: string, props: PDKPipelineProps) {
    super(scope, id);

    this.node.setContext(
      "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy",
      true
    );

    let codeRepository: IRepository;
    // process.env.BRANCH is set only in CodeBuild builds
    if (
      PDKPipeline.isDefaultBranch({
        node: this.node,
        defaultBranchName: props.defaultBranchName,
      })
    ) {
      // In the default branch, create a CodeCommit repository
      codeRepository = new Repository(this, "CodeRepository", {
        repositoryName: props.repositoryName,
      });
      codeRepository.applyRemovalPolicy(
        props.codeCommitRemovalPolicy ?? RemovalPolicy.RETAIN
      );
    } else {
      // In a non-default branch, use an existing CodeCommit repository
      codeRepository = Repository.fromRepositoryName(
        scope,
        "CodeRepository",
        props.repositoryName
      );
    }

    const accessLogsBucket = new Bucket(this, "AccessLogsBucket", {
      versioned: false,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
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

    const branch =
      process.env.BRANCH || props.defaultBranchName || DEFAULT_BRANCH_NAME;

    const synthShellStep = new ShellStep("Synth", {
      input: CodePipelineSource.codeCommit(codeRepository, branch),
      env:
        props.branchNamePrefixes && props.branchNamePrefixes.length > 0
          ? {
              BRANCH: branch,
            }
          : undefined,
      installCommands: ["npm install -g aws-cdk", "npx projen install"],
      commands:
        commands && commands.length > 0 ? commands : ["npx projen build"],
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
    this.branchNamePrefixes = props.branchNamePrefixes;
    this.defaultBranchName = props.defaultBranchName;
    this.repositoryName = props.repositoryName;

    if (
      props.branchNamePrefixes &&
      PDKPipeline.isDefaultBranch({
        node: this.node,
        defaultBranchName: props.defaultBranchName,
      })
    ) {
      new FeatureBranches(this, "FeatureBranchPipelines", {
        codeRepository: this.codeRepository,
        cdkSrcDir: props.primarySynthDirectory
          .split("/")
          .slice(0, -1)
          .join("/"),
        synthShellStepPartialProps: props.synthShellStepPartialProps,
        cdkCommand: props.cdkCommand,
        branchNamePrefixes: props.branchNamePrefixes,
        defaultBranchName: props.defaultBranchName || DEFAULT_BRANCH_NAME,
        codeBuildDefaults: props.codeBuildDefaults,
        dockerEnabledForSynth: props.dockerEnabledForSynth,
      });
    } else if (props.branchNamePrefixes) {
      Tags.of(Stack.of(this)).add("FeatureBranch", branch);
      Tags.of(Stack.of(this)).add("RepoName", this.repositoryName);
    }

    new CfnOutput(this, "CodeRepositoryGRCUrl", {
      value: this.codeRepository.repositoryCloneUrlGrc,
    });
  }

  /**
   * @inheritDoc
   */
  addStage(stage: Stage, options?: AddStageOpts): StageDeployment {
    if (
      this.branchNamePrefixes &&
      !PDKPipeline.isDefaultBranch({
        node: stage.node,
        defaultBranchName: this.defaultBranchName,
      })
    ) {
      Tags.of(stage).add("FeatureBranch", process.env.BRANCH!);
      Tags.of(stage).add("RepoName", this.repositoryName);
    }
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
