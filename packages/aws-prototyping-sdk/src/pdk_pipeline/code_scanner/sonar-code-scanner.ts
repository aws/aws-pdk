// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnOutput } from "aws-cdk-lib";
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
  readonly cdkOutDir?: string;
  readonly excludeGlobsForScan?: string[];
  readonly includeGlobsForScan?: string[];
  readonly sonarqubeEndpoint: string;
  readonly sonarqubeDefaultProfileOrGateName: string;
  readonly sonarqubeSpecificProfileOrGateName?: string;
  readonly sonarqubeAuthorizedGroup: string;
  readonly sonarqubeProjectName: string;
  readonly sonarqubeTags?: string[];
  readonly preArchiveCommands?: string[];
}

export interface SonarCodeScannerProps extends SonarCodeScannerConfig {
  readonly synthBuildArn: string;
  readonly artifactBucketArn: string;
  readonly artifactBucketKeyArn?: string;
}

const unpackSourceAndArtifacts = (includeGlobsForScan?: string[]) => [
  'export BUILT_ARTIFACT_URI=`aws codebuild batch-get-builds --ids $SYNTH_BUILD_ID | jq -r \'.builds[0].secondaryArtifacts[] | select(.artifactIdentifier == "Synth__") | .location\' | awk \'{sub("arn:aws:s3:::","s3://")}1\' $1`',
  "export SYNTH_SOURCE_URI=`aws codebuild batch-get-builds --ids $SYNTH_BUILD_ID | jq -r '.builds[0].sourceVersion' | awk '{sub(\"arn:aws:s3:::\",\"s3://\")}1' $1`",
  "aws s3 cp $SYNTH_SOURCE_URI source.zip",
  "aws s3 cp $BUILT_ARTIFACT_URI built.zip",
  "unzip source.zip -d src",
  "unzip built.zip -d built",
  "rm source.zip built.zip",
  `rsync -a built/* src --include="*/" ${
    includeGlobsForScan
      ? includeGlobsForScan.map((g) => `--include ${g}`).join(" ")
      : ""
  } --include="**/coverage/**" --include="**/cdk.out/**" --exclude="**/node_modules/**/*" --exclude="**/.env/**" --exclude="*" --prune-empty-dirs`,
];

const owaspScan = () =>
  `npx owasp-dependency-check --format HTML --out src/reports --exclude '**/.git/**/*' --scan src --enableExperimental --bin /tmp/dep-check --disableRetireJS`;

const cfnNagScan = (cdkOutDir?: string, cfnNagIgnorePath?: string) =>
  cdkOutDir
    ? `cfn_nag ${
        cfnNagIgnorePath ? `--deny-list-path=${cfnNagIgnorePath}` : ""
      } built/${cdkOutDir}/**/*.template.json --output-format=json > src/reports/cfn-nag-report.json`
    : 'echo "skipping cfn_nag as no cdkOutDir was specified.';

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
            commands: ["npm install -g aws-cdk", "gem install cfn-nag"],
          },
          build: {
            commands: [
              ...unpackSourceAndArtifacts(props.includeGlobsForScan),
              ...createSonarqubeProject(props),
              "mkdir -p src/reports",
              owaspScan(),
              cfnNagScan(props.cdkOutDir, props.cfnNagIgnorePath),
              "cd src",
              sonarqubeScanner(props.excludeGlobsForScan),
              ...generateSonarqubeReports(),
              ...(props.preArchiveCommands || []),
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
          ],
        }),
      }),
    });

    new CfnOutput(this, "SonarqubeSecretArn", {
      exportName: "SonarqubeSecretArn",
      value: sonarQubeToken.secretArn,
    });
  }
}
