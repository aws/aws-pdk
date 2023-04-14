/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { CfnOutput, Stack } from "aws-cdk-lib";
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
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import {
  createSonarqubeProject,
  generateSonarqubeReports,
  sonarqubeScanner,
} from "./sonarqube-commands";

export interface SonarCodeScannerConfig {
  /**
   * path to a file containing the cfn nag suppression rules.
   */
  readonly cfnNagIgnorePath?: string;

  /**
   * directory containing the synthesized cdk resources.
   */
  readonly cdkOutDir?: string;

  /**
   * glob patterns to exclude from sonar scan.
   */
  readonly excludeGlobsForScan?: string[];

  /**
   * glob patterns to include from sonar scan.
   */
  readonly includeGlobsForScan?: string[];

  /**
   * endpoint of the sonarqube instance i.e: https://<your-sonarqube-endpoint>.
   *
   * Note: Ensure a trailing '/' is not included.
   */
  readonly sonarqubeEndpoint: string;

  /**
   * Default profile/gate name i.e: your org profile.
   *
   * Note: These need to be set up in Sonarqube manually.
   */
  readonly sonarqubeDefaultProfileOrGateName: string;

  /**
   * Specific profile/gate name i.e: language specific.
   *
   * Note: These need to be set up in Sonarqube manually.
   */
  readonly sonarqubeSpecificProfileOrGateName?: string;

  /**
   * Group name in Sonarqube with access to administer this project.
   */
  readonly sonarqubeAuthorizedGroup: string;

  /**
   * Name of the project to create in Sonarqube.
   */
  readonly sonarqubeProjectName: string;

  /**
   * Tags to associate with this project.
   */
  readonly sonarqubeTags?: string[];

  /**
   * Hook which allows custom commands to be executed before the process commences the archival process.
   */
  readonly preArchiveCommands?: string[];
}

/**
 * SonarCodeScanners properties.
 */
export interface SonarCodeScannerProps extends SonarCodeScannerConfig {
  /**
   * ARN for the CodeBuild task responsible for executing the synth command.
   */
  readonly synthBuildArn: string;

  /**
   * S3 bucket ARN containing the built artifacts from the synth build.
   */
  readonly artifactBucketArn: string;

  /**
   * Artifact bucket key ARN used to encrypt the artifacts.
   */
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
              "export RESOLVED_SOURCE_VERSION=`aws codebuild batch-get-builds --ids $SYNTH_BUILD_ID | jq -r '.builds[0].resolvedSourceVersion'`",
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
      value: sonarQubeToken.secretArn,
    });

    [
      "AwsSolutions-SMG4",
      "AwsPrototyping-SecretsManagerRotationEnabled",
    ].forEach((RuleId) => {
      NagSuppressions.addResourceSuppressions(sonarQubeToken, [
        {
          id: RuleId,
          reason:
            "Key rotation is not possible as a user token needs to be generated from Sonarqube",
        },
      ]);
    });

    const stack = Stack.of(this);

    ["AwsSolutions-IAM5", "AwsPrototyping-IAMNoWildcardPermissions"].forEach(
      (RuleId) => {
        NagSuppressions.addResourceSuppressions(
          validationProject.role!,
          [
            {
              id: RuleId,
              reason:
                "Validation CodeBuild project requires access to the ArtifactsBucket and ability to create logs.",
              appliesTo: [
                {
                  regex: `/^Resource::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:logs:${PDKNag.getStackRegionRegex(
                    stack
                  )}:${PDKNag.getStackAccountRegex(
                    stack
                  )}:log-group:/aws/codebuild/<.*SonarCodeScannerValidationProject.*>:\\*$/g`,
                },
                {
                  regex: `/^Resource::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:codebuild:${PDKNag.getStackRegionRegex(
                    stack
                  )}:${PDKNag.getStackAccountRegex(
                    stack
                  )}:report-group/<.*SonarCodeScannerValidationProject.*>-\\*$/g`,
                },
                {
                  regex: `/^Action::s3:GetObject\\*$/g`,
                },
                {
                  regex: "/^Resource::<ArtifactsBucket.*.Arn>/\\*\\*$/g",
                },
              ],
            },
          ],
          true
        );
      }
    );
  }
}
