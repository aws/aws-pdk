/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  Aspects,
  CfnOutput,
  RemovalPolicy,
  Stack,
  Stage,
  Tags,
} from "aws-cdk-lib";
import { IRepository, Repository } from "aws-cdk-lib/aws-codecommit";
import { Pipeline, PipelineType } from "aws-cdk-lib/aws-codepipeline";
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
  StageDeployment,
} from "aws-cdk-lib/pipelines";
import { NagSuppressions } from "cdk-nag";
import { Construct, Node } from "constructs";
import {
  SonarCodeScanner,
  SonarCodeScannerConfig,
} from "./code_scanner/sonar-code-scanner";
import { PDKPipelineProps } from "./codepipeline-props";
import { FeatureBranches } from "./feature-branches";

export * from "./code_scanner/sonar-code-scanner";

export const DEFAULT_BRANCH_NAME = "mainline";

export interface IsDefaultBranchProps {
  readonly node?: Node;
  readonly defaultBranchName?: string;
}

export class PDKPipeline extends Construct {
  static readonly ALL_BRANCHES = [""];
  static readonly defaultBranchName = DEFAULT_BRANCH_NAME;

  public static normalizeBranchName(branchName: string): string {
    return branchName.replace(/[^a-zA-Z0-9-]/g, "-");
  }

  public static isDefaultBranch(props: IsDefaultBranchProps = {}): boolean {
    if (!process.env.BRANCH) {
      return true;
    }
    const defaultBranchName: string =
      props.defaultBranchName ||
      (props.node && props.node.tryGetContext("defaultBranchName")) ||
      PDKPipeline.defaultBranchName;
    return defaultBranchName === process.env.BRANCH;
  }

  public static getBranchPrefix(props: IsDefaultBranchProps = {}): string {
    return PDKPipeline.isDefaultBranch(props)
      ? ""
      : PDKPipeline.normalizeBranchName(process.env.BRANCH!) + "-";
  }

  readonly codePipeline: CodePipeline;
  readonly codeRepository?: IRepository;
  private readonly sonarCodeScannerConfig?: SonarCodeScannerConfig;
  private readonly branchNamePrefixes?: string[];
  private readonly defaultBranchName?: string;
  private readonly repositoryName?: string;

  constructor(scope: Construct, id: string, props: PDKPipelineProps) {
    super(scope, id);

    if (!props.repositoryName && !props.codestarConnectionArn) {
      throw new Error(
        "Either repositoryName or codestarConnectionArn must be provided"
      );
    }

    if (props.codestarConnectionArn && !props.repositoryOwnerAndName) {
      throw new Error(
        "repositoryOwnerAndName is required when using codestarConnectionArn"
      );
    }

    this.node.setContext(
      "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy",
      true
    );

    const branch =
      process.env.BRANCH || props.defaultBranchName || DEFAULT_BRANCH_NAME;

    let source: CodePipelineSource;

    if (props.repositoryName) {
      // CodeCommit repository logic
      let codeRepository: IRepository;
      if (
        PDKPipeline.isDefaultBranch({
          node: this.node,
          defaultBranchName: props.defaultBranchName,
        })
      ) {
        codeRepository = new Repository(this, "CodeRepository", {
          repositoryName: props.repositoryName,
        });
        codeRepository.applyRemovalPolicy(
          props.codeCommitRemovalPolicy ?? RemovalPolicy.RETAIN
        );
      } else {
        codeRepository = Repository.fromRepositoryName(
          scope,
          "CodeRepository",
          props.repositoryName
        );
      }
      this.codeRepository = codeRepository;
      source = CodePipelineSource.codeCommit(codeRepository, branch);
    } else {
      // CodeStar connection logic
      source = CodePipelineSource.connection(
        props.repositoryOwnerAndName!,
        branch,
        {
          connectionArn: props.codestarConnectionArn!,
        }
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
      pipelineType: PipelineType.V1,
    });

    const {
      input,
      primaryOutputDirectory,
      commands,
      ...synthShellStepPartialProps
    } = props.synthShellStepPartialProps || {};

    const synthShellStep = new ShellStep("Synth", {
      input: source,
      env:
        props.branchNamePrefixes && props.branchNamePrefixes.length > 0
          ? {
              BRANCH: branch,
            }
          : undefined,
      installCommands: ["npm install -g aws-cdk pnpm", "npx projen install"],
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
        branchNamePrefixes: props.branchNamePrefixes,
        cdkSrcDir: props.cdkSrcDir || path.dirname(props.primarySynthDirectory),
        defaultBranchName: props.defaultBranchName || DEFAULT_BRANCH_NAME,
        repositoryType: props.repositoryName ? "codecommit" : "codestar",
        connectionArn: props.codestarConnectionArn,
        repositoryOwnerAndName: props.repositoryOwnerAndName,
        repository: this.codeRepository,
        synthShellStepPartialProps: props.synthShellStepPartialProps,
        cdkCommand: props.cdkCommand,
        codeBuildDefaults: props.codeBuildDefaults,
        dockerEnabledForSynth: props.dockerEnabledForSynth,
      });
    } else if (props.branchNamePrefixes) {
      Tags.of(Stack.of(this)).add("FeatureBranch", branch);
      if (this.repositoryName) {
        Tags.of(Stack.of(this)).add("RepoName", this.repositoryName);
      }
    }

    if (this.codeRepository) {
      new CfnOutput(this, "CodeRepositoryGRCUrl", {
        value: this.codeRepository.repositoryCloneUrlGrc,
      });
    }
  }

  addStage(stage: Stage, options?: AddStageOpts): StageDeployment {
    if (
      this.branchNamePrefixes &&
      !PDKPipeline.isDefaultBranch({
        node: stage.node,
        defaultBranchName: this.defaultBranchName,
      })
    ) {
      Tags.of(stage).add("FeatureBranch", process.env.BRANCH!);
      if (this.repositoryName) {
        Tags.of(stage).add("RepoName", this.repositoryName);
      }
    }
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

  private suppressCDKViolations() {
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
