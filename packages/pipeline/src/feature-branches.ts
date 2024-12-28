/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  BuildSpec,
  ComputeType,
  LinuxBuildImage,
  Project,
} from "aws-cdk-lib/aws-codebuild";
import { IRepository } from "aws-cdk-lib/aws-codecommit";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ShellStepProps } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { CodePipelineProps } from "./codepipeline-props";

export interface FeatureBranchesProps
  extends Pick<
    CodePipelineProps,
    "codeBuildDefaults" | "dockerEnabledForSynth"
  > {
  readonly branchNamePrefixes: string[];
  readonly cdkSrcDir: string;
  readonly connectionArn?: string;
  readonly repositoryOwnerAndName?: string;
  readonly repository?: IRepository;
  readonly repositoryType: "codecommit" | "codestar";
  readonly defaultBranchName: string;
  readonly synthShellStepPartialProps?: ShellStepProps;
  readonly cdkCommand?: string;
}

export class FeatureBranches extends Construct {
  constructor(scope: Construct, id: string, props: FeatureBranchesProps) {
    super(scope, id);

    const buildSpec = BuildSpec.fromObject({
      version: "0.2",
      phases: {
        install: {
          commands: ["npm install -g aws-cdk pnpm", "npx projen install"],
        },
        build: {
          commands: [
            "git branch -a",
            'export BRANCH="$(git rev-parse --abbrev-ref HEAD)"',
            props.cdkCommand || "npx projen deploy",
          ],
        },
      },
    });

    props.branchNamePrefixes.forEach((prefix) => {
      const project = new Project(this, `FeaturePipeline-${prefix}`, {
        ...(props.codeBuildDefaults || {}),
        environment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
          computeType: ComputeType.SMALL,
          privileged: props.dockerEnabledForSynth,
        },
        buildSpec,
      });

      project.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "sts:AssumeRole",
            "cloudformation:*",
            "iam:*",
            "s3:*",
            "ecr:*",
            "ec2:*",
            "ssm:*",
            "codebuild:*",
            "codecommit:*",
            "codestar-connections:*",
          ],
          resources: ["*"],
        })
      );
    });
  }
}
