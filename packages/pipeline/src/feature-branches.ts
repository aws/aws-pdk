/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

import * as path from "path";
import { PDKNag } from "@aws-pdk/pdk-nag";
import { Stack } from "aws-cdk-lib";
import {
  BuildSpec,
  ComputeType,
  LinuxBuildImage,
  Project,
  Source,
} from "aws-cdk-lib/aws-codebuild";
import { IRepository } from "aws-cdk-lib/aws-codecommit";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { CodePipelineProps, ShellStepProps } from "aws-cdk-lib/pipelines";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export interface FeatureBranchesProps
  extends Pick<
    CodePipelineProps,
    "codeBuildDefaults" | "dockerEnabledForSynth"
  > {
  /**
   * Branch name prefixes
   * Any branches created matching this list of prefixes will create a new pipeline and stack.
   *
   * @example
   * // Creates a new pipeline and stack for any branch
   * new PDKPipeline(this, 'PDKPipeline', {
   *   repositoryName: 'my-repo',
   *   branchNamePrefixes: [''],
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
   */
  readonly branchNamePrefixes: string[];

  /**
   * The directory to run cdk synth from.
   */
  readonly cdkSrcDir: string;

  /**
   * The CodeCommit repository.
   */
  readonly codeRepository: IRepository;

  /**
   * Default branch.
   */
  readonly defaultBranchName: string;

  /**
   * PDKPipeline by default assumes a NX Monorepo structure for it's codebase and
   * uses sane defaults for the install and run commands. To override these defaults
   * and/or provide additional inputs, specify env settings, etc you can provide
   * a partial ShellStepProps.
   */
  readonly synthShellStepPartialProps?: ShellStepProps;

  /**
   * CDK command. Override the command used to call cdk for synth and deploy.
   *
   * @default 'npx cdk'
   */
  readonly cdkCommand?: string;
}

export class FeatureBranches extends Construct {
  constructor(scope: Construct, id: string, props: FeatureBranchesProps) {
    super(scope, id);

    const buildCommands: string[] =
      props.synthShellStepPartialProps?.commands &&
      props.synthShellStepPartialProps.commands.length > 0
        ? props.synthShellStepPartialProps.commands
        : ["npx nx run-many --target=build --all"];

    const installCommands: string[] =
      props.synthShellStepPartialProps?.installCommands &&
      props.synthShellStepPartialProps.installCommands.length > 0
        ? props.synthShellStepPartialProps.installCommands
        : [
            "npm install -g aws-cdk",
            "yarn install --frozen-lockfile || npx projen && yarn install --frozen-lockfile",
          ];

    const cdkCommand = props.cdkCommand ?? "npx cdk";

    const createFeatureBranchProject = new Project(
      this,
      "CreateFeatureBranchProject",
      {
        description: "Build project to deploy feature branch pipelines",
        source: Source.codeCommit({ repository: props.codeRepository }),
        environment: {
          buildImage: LinuxBuildImage.STANDARD_6_0,
          computeType: props.codeBuildDefaults?.buildEnvironment?.computeType
            ? props.codeBuildDefaults.buildEnvironment.computeType
            : ComputeType.SMALL,
          privileged: props.dockerEnabledForSynth,
        },
        buildSpec: BuildSpec.fromObjectToYaml({
          version: "0.2",
          phases: {
            install: {
              commands: installCommands,
            },
            build: {
              commands: [
                ...buildCommands,
                `cd ${props.cdkSrcDir}`,
                `${cdkCommand} synth`,
                `${cdkCommand} deploy --require-approval=never`,
              ],
            },
          },
          artifacts: {
            files: ["**/*"],
          },
        }),
      }
    );

    createFeatureBranchProject.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["sts:AssumeRole"],
        resources: [`arn:*:iam::${Stack.of(this).account}:role/*`],
        conditions: {
          "ForAnyValue:StringEquals": {
            "iam:ResourceTag/aws-cdk:bootstrap-role": [
              "image-publishing",
              "file-publishing",
              "deploy",
            ],
          },
        },
      })
    );

    const createFeatureBranchFunction = new Function(
      this,
      "LambdaTriggerCreateBranch",
      {
        runtime: Runtime.PYTHON_3_11,
        code: Code.fromAsset(path.join(__dirname, "lambda/create_branch")),
        handler: "create_branch.handler",
        environment: {
          CODEBUILD_PROJECT: createFeatureBranchProject.projectName,
          MAIN_BRANCH: props.defaultBranchName,
        },
      }
    );

    createFeatureBranchFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["codebuild:StartBuild"],
        resources: [createFeatureBranchProject.projectArn],
      })
    );

    const destroyFeatureBranchFunction = new Function(
      this,
      "LambdaTriggerDestroyBranch",
      {
        runtime: Runtime.PYTHON_3_11,
        code: Code.fromAsset(path.join(__dirname, "lambda/destroy_branch")),
        handler: "destroy_branch.handler",
        environment: {
          MAIN_BRANCH: props.defaultBranchName,
          REPO_NAME: props.codeRepository.repositoryName,
        },
      }
    );
    destroyFeatureBranchFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cloudformation:DeleteStack"],
        resources: [
          Stack.of(this).formatArn({
            service: "cloudformation",
            resource: "stack",
            resourceName: "*/*",
          }),
        ],
        conditions: {
          "ForAllValues:StringEquals": {
            "aws:TagKeys": ["FeatureBranch", "RepoName"],
          },
        },
      })
    );
    destroyFeatureBranchFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["tag:GetResources"],
        resources: ["*"],
      })
    );

    props.codeRepository.onReferenceCreated("BranchCreateTrigger", {
      target: new LambdaFunction(createFeatureBranchFunction),
      description: "AWS CodeCommit reference created event.",
      eventPattern: {
        detail: {
          referenceType: ["branch"],
          referenceName: props.branchNamePrefixes.map((prefix) => ({ prefix })),
        },
      },
    });

    props.codeRepository.onReferenceDeleted("BranchDestroyTrigger", {
      target: new LambdaFunction(destroyFeatureBranchFunction),
      description: "AWS CodeCommit reference deleted event.",
      eventPattern: {
        detail: {
          referenceType: ["branch"],
          referenceName: props.branchNamePrefixes.map((prefix) => {
            return { prefix };
          }),
        },
      },
    });

    const stack = Stack.of(this);

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          createFeatureBranchProject.role!,
          [
            {
              id: RuleId,
              reason:
                "CodeBuild requires get, list, and pull access to the CodeCommit repository.",
              appliesTo: [
                "Action::codecommit:Get*",
                "Action::codecommit:List*",
              ],
            },
            {
              id: RuleId,
              reason:
                "CodeBuild requires access to create report groups that are dynamically determined.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:codebuild:${PDKNag.getStackRegionRegex(
                    stack
                  )}:${PDKNag.getStackAccountRegex(
                    stack
                  )}:report-group/<[a-zA-Z0-9]*CreateFeatureBranchProject.*>-\\*$/g`,
                },
              ],
            },
            {
              id: RuleId,
              reason:
                "CodeBuild requires access to manage logs and streams whose names are dynamically determined.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:logs:${PDKNag.getStackRegionRegex(
                    stack
                  )}:${PDKNag.getStackAccountRegex(
                    stack
                  )}:log-group:/aws/codebuild/<[a-zA-Z0-9]*CreateFeatureBranchProject.*>:\\*$/g`,
                },
              ],
            },
            {
              id: RuleId,
              reason:
                "CodeBuild requires access to assume a role from within the current account limited by a condition in order to deploy.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:\\*:iam::${PDKNag.getStackAccountRegex(
                    stack
                  )}:role/\\*$/g`,
                },
              ],
            },
          ],
          true
        );

        NagSuppressions.addResourceSuppressions(
          destroyFeatureBranchFunction.role!,
          [
            {
              id: RuleId,
              reason:
                "The DestroyBranch Lambda requires access to delete any stacks with specific tags.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:cloudformation:${PDKNag.getStackRegionRegex(
                    stack
                  )}:${PDKNag.getStackAccountRegex(stack)}:stack/\\*/\\*$/g`,
                },
              ],
            },
            {
              id: RuleId,
              reason:
                "The DestroyBranch Lambda requires access to look up CloudFormation stacks by tag. The Resource Group Tagging API must use 'Resource': '*'.",
              appliesTo: ["Resource::*"],
            },
          ],
          true
        );
      }
    );

    ["AwsSolutions-IAM4", "AwsPrototyping-IAMNoManagedPolicies"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          createFeatureBranchFunction,
          [
            {
              id: RuleId,
              reason:
                "Lambda functions use the default AWS LambdaBasicExecutionRole managed role.",
              appliesTo: [
                {
                  regex: `/^Policy::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole$/g`,
                },
              ],
            },
          ],
          true
        );
        NagSuppressions.addResourceSuppressions(
          destroyFeatureBranchFunction,
          [
            {
              id: RuleId,
              reason:
                "Lambda functions use the default AWS LambdaBasicExecutionRole managed role.",
              appliesTo: [
                {
                  regex: `/^Policy::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole$/g`,
                },
              ],
            },
          ],
          true
        );
      }
    );

    [
      "AwsSolutions-CB4",
      "AwsPrototyping-CodeBuildProjectKMSEncryptedArtifacts",
    ].forEach((RuleId) => {
      NagSuppressions.addResourceSuppressions(createFeatureBranchProject, [
        {
          id: RuleId,
          reason: "Encryption of Codebuild is not required.",
        },
      ]);
    });
  }
}
