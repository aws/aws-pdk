// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  BuildEnvironmentVariableType,
  BuildSpec,
  LinuxBuildImage,
  Project,
} from "aws-cdk-lib/aws-codebuild";
import { EventField, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { CodeBuildProject } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import {
  createSonarqubeProject,
  generateSonarqubeReports,
  sonarqubeScanner,
} from "./sonarqube-commands";

export interface SonarCodeScannerConfig {
  readonly cfnNagIgnorePath?: string;
  readonly sonarqubeEndpoint: string;
  readonly sonarqubeDefaultProfileOrGateName: string;
  readonly sonarqubeSpecificProfileOrGateName?: string;
  readonly sonarqubeAuthorizedGroup: string;
  readonly sonarqubeProjectName: string;
  readonly sonarqubeTags?: string[];
}

export interface SonarCodeScannerProps extends SonarCodeScannerConfig {
  readonly synthBuildArn: string;
  readonly artifactBucketArn: string;
  readonly artifactBucketKeyArn?: string;
}

const unpackSourceAndArtifacts = () => [
  'export SYNTH_ARTIFACT_URI=`echo $SYNTH_ARTIFACT_LOCATION | awk \'{sub("arn:aws:s3:::","s3://")}1\' $1`',
  'export SYNTH_SOURCE_URI=`echo $SYNTH_SOURCE_VERSION | awk \'{sub("arn:aws:s3:::","s3://")}1\' $1`',
  "aws s3 cp $SYNTH_SOURCE_URI source.zip",
  "aws s3 cp $SYNTH_ARTIFACT_URI dist.zip",
  "unzip source.zip",
  "unzip dist.zip -d cdk.out",
  "rm source.zip dist.zip",
];

const owaspScan = () =>
  "npx owasp-dependency-check --format HTML --out reports --exclude '**/node_modules/**/*' --exclude '**/reports/**/*' --exclude '**/cdk.out/**/*' --exclude '**/.env/**/*' --exclude '**/dist/**/*' --exclude '**/.git/**/*' --scan . --enableExperimental --bin /tmp/dep-check --disableRetireJS";

const cfnNagScan = (cfnNagIgnorePath?: string) =>
  `cfn_nag ${
    cfnNagIgnorePath ?? ""
  } cdk.out/**/*.template.json --output-format=json > reports/cfn-nag-report.json`;

export class SonarCodeScanner extends Construct {
  constructor(scope: Construct, id: string, props: SonarCodeScannerProps) {
    super(scope, id);

    const sonarQubeToken = new Secret(this, "SonarQubeToken");

    const synthBuildProject = Project.fromProjectArn(
      this,
      "SynthBuildProject",
      props.synthBuildArn
    );

    const validationProject = new Project(this, "ValidationProject", {
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0,
      },
      environmentVariables: {
        SONARQUBE_TOKEN: {
          type: BuildEnvironmentVariableType.SECRETS_MANAGER,
          value: sonarQubeToken.secretArn,
        },
        SONARQUBE_ENDPOINT: {
          type: BuildEnvironmentVariableType.PLAINTEXT,
          value: props.sonarqubeEndpoint,
        },
        PROJECT_NAME: {
          type: BuildEnvironmentVariableType.PLAINTEXT,
          value: props.sonarqubeProjectName,
        },
      },
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        env: {
          shell: "bash",
        },
        phases: {
          install: {
            commands: ["gem install cfn-nag"],
          },
          build: {
            commands: [
              ...unpackSourceAndArtifacts(),
              ...createSonarqubeProject(props),
              owaspScan(),
              cfnNagScan(props.cfnNagIgnorePath),
              sonarqubeScanner(),
              ...generateSonarqubeReports(),
            ],
          },
        },
      }),
    });

    validationProject.addToRolePolicy(
      new PolicyStatement({
        actions: ["codebuild:BatchGetBuilds"],
        effect: Effect.ALLOW,
        resources: [synthBuildProject.projectArn],
      })
    );

    validationProject.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject*"],
        effect: Effect.ALLOW,
        resources: [props.artifactBucketArn, `${props.artifactBucketArn}/**`],
      })
    );

    props.artifactBucketKeyArn &&
      validationProject.addToRolePolicy(
        new PolicyStatement({
          actions: ["kms:Decrypt", "kms:DescribeKey"],
          effect: Effect.ALLOW,
          resources: [props.artifactBucketKeyArn],
        })
      );

    synthBuildProject.onBuildSucceeded("OnSynthSuccess", {
      target: new CodeBuildProject(validationProject, {
        event: RuleTargetInput.fromObject({
          environmentVariablesOverride: [
            {
              name: "SYNTH_BUILD_ID",
              type: "PLAINTEXT",
              value: EventField.fromPath("$.detail.build-id"),
            },
            {
              name: "SYNTH_ARTIFACT_LOCATION",
              type: "PLAINTEXT",
              value: EventField.fromPath(
                "$.detail.additional-information.artifact.location"
              ),
            },
            {
              name: "SYNTH_SOURCE_VERSION",
              type: "PLAINTEXT",
              value: EventField.fromPath(
                "$.detail.additional-information.source-version"
              ),
            },
          ],
        }),
      }),
    });
  }
}
