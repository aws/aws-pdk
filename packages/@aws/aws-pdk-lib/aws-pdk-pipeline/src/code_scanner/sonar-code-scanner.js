"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonarCodeScanner = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_codebuild_1 = require("aws-cdk-lib/aws-codebuild");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_secretsmanager_1 = require("aws-cdk-lib/aws-secretsmanager");
const constructs_1 = require("constructs");
const sonarqube_commands_1 = require("./sonarqube-commands");
const unpackSourceAndArtifacts = (includeGlobsForScan) => [
    'export BUILT_ARTIFACT_URI=`aws codebuild batch-get-builds --ids $SYNTH_BUILD_ID | jq -r \'.builds[0].secondaryArtifacts[] | select(.artifactIdentifier == "Synth__") | .location\' | awk \'{sub("arn:aws:s3:::","s3://")}1\' $1`',
    "export SYNTH_SOURCE_URI=`aws codebuild batch-get-builds --ids $SYNTH_BUILD_ID | jq -r '.builds[0].sourceVersion' | awk '{sub(\"arn:aws:s3:::\",\"s3://\")}1' $1`",
    "aws s3 cp $SYNTH_SOURCE_URI source.zip",
    "aws s3 cp $BUILT_ARTIFACT_URI built.zip",
    "unzip source.zip -d src",
    "unzip built.zip -d built",
    "rm source.zip built.zip",
    `rsync -a built/* src --include="*/" ${includeGlobsForScan
        ? includeGlobsForScan.map((g) => `--include ${g}`).join(" ")
        : ""} --include="**/coverage/**" --include="**/cdk.out/**" --exclude="**/node_modules/**/*" --exclude="**/.env/**" --exclude="*" --prune-empty-dirs`,
];
const owaspScan = () => `npx owasp-dependency-check --format HTML --out src/reports --exclude '**/.git/**/*' --scan src --enableExperimental --bin /tmp/dep-check --disableRetireJS`;
const cfnNagScan = (cdkOutDir, cfnNagIgnorePath) => cdkOutDir
    ? `cfn_nag ${cfnNagIgnorePath ? `--deny-list-path=${cfnNagIgnorePath}` : ""} built/${cdkOutDir}/**/*.template.json --output-format=json > src/reports/cfn-nag-report.json`
    : 'echo "skipping cfn_nag as no cdkOutDir was specified.';
class SonarCodeScanner extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const sonarQubeToken = new aws_secretsmanager_1.Secret(this, "SonarQubeToken");
        const synthBuildProject = aws_codebuild_1.Project.fromProjectArn(this, "SynthBuildProject", props.synthBuildArn);
        const validationProject = new aws_codebuild_1.Project(this, "ValidationProject", {
            environment: {
                buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_5_0,
            },
            environmentVariables: {
                SONARQUBE_TOKEN: {
                    type: aws_codebuild_1.BuildEnvironmentVariableType.SECRETS_MANAGER,
                    value: sonarQubeToken.secretArn,
                },
                SONARQUBE_ENDPOINT: {
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PLAINTEXT,
                    value: props.sonarqubeEndpoint,
                },
                PROJECT_NAME: {
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PLAINTEXT,
                    value: props.sonarqubeProjectName,
                },
            },
            buildSpec: aws_codebuild_1.BuildSpec.fromObject({
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
                            ...sonarqube_commands_1.createSonarqubeProject(props),
                            "mkdir -p src/reports",
                            owaspScan(),
                            cfnNagScan(props.cdkOutDir, props.cfnNagIgnorePath),
                            "cd src",
                            sonarqube_commands_1.sonarqubeScanner(props.excludeGlobsForScan),
                            ...sonarqube_commands_1.generateSonarqubeReports(),
                            ...(props.preArchiveCommands || []),
                        ],
                    },
                },
            }),
        });
        validationProject.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: ["codebuild:BatchGetBuilds"],
            effect: aws_iam_1.Effect.ALLOW,
            resources: [synthBuildProject.projectArn],
        }));
        validationProject.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: ["s3:GetObject*"],
            effect: aws_iam_1.Effect.ALLOW,
            resources: [props.artifactBucketArn, `${props.artifactBucketArn}/**`],
        }));
        props.artifactBucketKeyArn &&
            validationProject.addToRolePolicy(new aws_iam_1.PolicyStatement({
                actions: ["kms:Decrypt", "kms:DescribeKey"],
                effect: aws_iam_1.Effect.ALLOW,
                resources: [props.artifactBucketKeyArn],
            }));
        synthBuildProject.onBuildSucceeded("OnSynthSuccess", {
            target: new aws_events_targets_1.CodeBuildProject(validationProject, {
                event: aws_events_1.RuleTargetInput.fromObject({
                    environmentVariablesOverride: [
                        {
                            name: "SYNTH_BUILD_ID",
                            type: "PLAINTEXT",
                            value: aws_events_1.EventField.fromPath("$.detail.build-id"),
                        },
                    ],
                }),
            }),
        });
        new aws_cdk_lib_1.CfnOutput(this, "SonarqubeSecretArn", {
            exportName: "SonarqubeSecretArn",
            value: sonarQubeToken.secretArn,
        });
    }
}
exports.SonarCodeScanner = SonarCodeScanner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29uYXItY29kZS1zY2FubmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic29uYXItY29kZS1zY2FubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxRUFBcUU7QUFDckUsc0NBQXNDOzs7QUFFdEMsNkNBQXdDO0FBQ3hDLDZEQUttQztBQUNuQyx1REFBcUU7QUFDckUsdUVBQWtFO0FBQ2xFLGlEQUE4RDtBQUM5RCx1RUFBd0Q7QUFDeEQsMkNBQXVDO0FBQ3ZDLDZEQUk4QjtBQXFGOUIsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLG1CQUE4QixFQUFFLEVBQUUsQ0FBQztJQUNuRSxrT0FBa087SUFDbE8sa0tBQWtLO0lBQ2xLLHdDQUF3QztJQUN4Qyx5Q0FBeUM7SUFDekMseUJBQXlCO0lBQ3pCLDBCQUEwQjtJQUMxQix5QkFBeUI7SUFDekIsdUNBQ0UsbUJBQW1CO1FBQ2pCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQzVELENBQUMsQ0FBQyxFQUNOLGdKQUFnSjtDQUNqSixDQUFDO0FBRUYsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQ3JCLDRKQUE0SixDQUFDO0FBRS9KLE1BQU0sVUFBVSxHQUFHLENBQUMsU0FBa0IsRUFBRSxnQkFBeUIsRUFBRSxFQUFFLENBQ25FLFNBQVM7SUFDUCxDQUFDLENBQUMsV0FDRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQzlELFVBQVUsU0FBUyw0RUFBNEU7SUFDakcsQ0FBQyxDQUFDLHVEQUF1RCxDQUFDO0FBRTlELE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVM7SUFDN0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE0QjtRQUNwRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FB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aUJBQWlCLEVBQUU7Z0JBQzlDLEtBQUssRUFBRSw0QkFBZSxDQUFDLFVBQVUsQ0FBQztvQkFDaEMsNEJBQTRCLEVBQUU7d0JBQzVCOzRCQUNFLElBQUksRUFBRSxnQkFBZ0I7NEJBQ3RCLElBQUksRUFBRSxXQUFXOzRCQUNqQixLQUFLLEVBQUUsdUJBQVUsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUM7eUJBQ2hEO3FCQUNGO2lCQUNGLENBQUM7YUFDSCxDQUFDO1NBQ0gsQ0FBQyxDQUFDO1FBRUgsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUN4QyxVQUFVLEVBQUUsb0JBQW9CO1lBQ2hDLEtBQUssRUFBRSxjQUFjLENBQUMsU0FBUztTQUNoQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFyR0QsNENBcUdDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxuXG5pbXBvcnQgeyBDZm5PdXRwdXQgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7XG4gIEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUsXG4gIEJ1aWxkU3BlYyxcbiAgTGludXhCdWlsZEltYWdlLFxuICBQcm9qZWN0LFxufSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVidWlsZFwiO1xuaW1wb3J0IHsgRXZlbnRGaWVsZCwgUnVsZVRhcmdldElucHV0IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1ldmVudHNcIjtcbmltcG9ydCB7IENvZGVCdWlsZFByb2plY3QgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzXCI7XG5pbXBvcnQgeyBFZmZlY3QsIFBvbGljeVN0YXRlbWVudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XG5pbXBvcnQgeyBTZWNyZXQgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0IHtcbiAgY3JlYXRlU29uYXJxdWJlUHJvamVjdCxcbiAgZ2VuZXJhdGVTb25hcnF1YmVSZXBvcnRzLFxuICBzb25hcnF1YmVTY2FubmVyLFxufSBmcm9tIFwiLi9zb25hcnF1YmUtY29tbWFuZHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTb25hckNvZGVTY2FubmVyQ29uZmlnIHtcbiAgLyoqXG4gICAqIHBhdGggdG8gYSBmaWxlIGNvbnRhaW5pbmcgdGhlIGNmbiBuYWcgc3VwcHJlc3Npb24gcnVsZXMuXG4gICAqL1xuICByZWFkb25seSBjZm5OYWdJZ25vcmVQYXRoPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBkaXJlY3RvcnkgY29udGFpbmluZyB0aGUgc3ludGhlc2l6ZWQgY2RrIHJlc291cmNlcy5cbiAgICovXG4gIHJlYWRvbmx5IGNka091dERpcj86IHN0cmluZztcblxuICAvKipcbiAgICogZ2xvYiBwYXR0ZXJucyB0byBleGNsdWRlIGZyb20gc29uYXIgc2Nhbi5cbiAgICovXG4gIHJlYWRvbmx5IGV4Y2x1ZGVHbG9ic0ZvclNjYW4/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogZ2xvYiBwYXR0ZXJucyB0byBpbmNsdWRlIGZyb20gc29uYXIgc2Nhbi5cbiAgICovXG4gIHJlYWRvbmx5IGluY2x1ZGVHbG9ic0ZvclNjYW4/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogZW5kcG9pbnQgb2YgdGhlIHNvbmFycXViZSBpbnN0YW5jZSBpLmU6IGh0dHBzOi8vPHlvdXItc29uYXJxdWJlLWVuZHBvaW50Pi5cbiAgICpcbiAgICogTm90ZTogRW5zdXJlIGEgdHJhaWxpbmcgJy8nIGlzIG5vdCBpbmNsdWRlZC5cbiAgICovXG4gIHJlYWRvbmx5IHNvbmFycXViZUVuZHBvaW50OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgcHJvZmlsZS9nYXRlIG5hbWUgaS5lOiB5b3VyIG9yZyBwcm9maWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGVzZSBuZWVkIHRvIGJlIHNldCB1cCBpbiBTb25hcnF1YmUgbWFudWFsbHkuXG4gICAqL1xuICByZWFkb25seSBzb25hcnF1YmVEZWZhdWx0UHJvZmlsZU9yR2F0ZU5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogU3BlY2lmaWMgcHJvZmlsZS9nYXRlIG5hbWUgaS5lOiBsYW5ndWFnZSBzcGVjaWZpYy5cbiAgICpcbiAgICogTm90ZTogVGhlc2UgbmVlZCB0byBiZSBzZXQgdXAgaW4gU29uYXJxdWJlIG1hbnVhbGx5LlxuICAgKi9cbiAgcmVhZG9ubHkgc29uYXJxdWJlU3BlY2lmaWNQcm9maWxlT3JHYXRlTmFtZT86IHN0cmluZztcblxuICAvKipcbiAgICogR3JvdXAgbmFtZSBpbiBTb25hcnF1YmUgd2l0aCBhY2Nlc3MgdG8gYWRtaW5pc3RlciB0aGlzIHByb2plY3QuXG4gICAqL1xuICByZWFkb25seSBzb25hcnF1YmVBdXRob3JpemVkR3JvdXA6IHN0cmluZztcblxuICAvKipcbiAgICogTmFtZSBvZiB0aGUgcHJvamVjdCB0byBjcmVhdGUgaW4gU29uYXJxdWJlLlxuICAgKi9cbiAgcmVhZG9ubHkgc29uYXJxdWJlUHJvamVjdE5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogVGFncyB0byBhc3NvY2lhdGUgd2l0aCB0aGlzIHByb2plY3QuXG4gICAqL1xuICByZWFkb25seSBzb25hcnF1YmVUYWdzPzogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIEhvb2sgd2hpY2ggYWxsb3dzIGN1c3RvbSBjb21tYW5kcyB0byBiZSBleGVjdXRlZCBiZWZvcmUgdGhlIHByb2Nlc3MgY29tbWVuY2VzIHRoZSBhcmNoaXZhbCBwcm9jZXNzLlxuICAgKi9cbiAgcmVhZG9ubHkgcHJlQXJjaGl2ZUNvbW1hbmRzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogU29uYXJDb2RlU2Nhbm5lcnMgcHJvcGVydGllcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb25hckNvZGVTY2FubmVyUHJvcHMgZXh0ZW5kcyBTb25hckNvZGVTY2FubmVyQ29uZmlnIHtcbiAgLyoqXG4gICAqIEFSTiBmb3IgdGhlIENvZGVCdWlsZCB0YXNrIHJlc3BvbnNpYmxlIGZvciBleGVjdXRpbmcgdGhlIHN5bnRoIGNvbW1hbmQuXG4gICAqL1xuICByZWFkb25seSBzeW50aEJ1aWxkQXJuOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFMzIGJ1Y2tldCBBUk4gY29udGFpbmluZyB0aGUgYnVpbHQgYXJ0aWZhY3RzIGZyb20gdGhlIHN5bnRoIGJ1aWxkLlxuICAgKi9cbiAgcmVhZG9ubHkgYXJ0aWZhY3RCdWNrZXRBcm46IHN0cmluZztcblxuICAvKipcbiAgICogQXJ0aWZhY3QgYnVja2V0IGtleSBBUk4gdXNlZCB0byBlbmNyeXB0IHRoZSBhcnRpZmFjdHMuXG4gICAqL1xuICByZWFkb25seSBhcnRpZmFjdEJ1Y2tldEtleUFybj86IHN0cmluZztcbn1cblxuY29uc3QgdW5wYWNrU291cmNlQW5kQXJ0aWZhY3RzID0gKGluY2x1ZGVHbG9ic0ZvclNjYW4/OiBzdHJpbmdbXSkgPT4gW1xuICAnZXhwb3J0IEJVSUxUX0FSVElGQUNUX1VSST1gYXdzIGNvZGVidWlsZCBiYXRjaC1nZXQtYnVpbGRzIC0taWRzICRTWU5USF9CVUlMRF9JRCB8IGpxIC1yIFxcJy5idWlsZHNbMF0uc2Vjb25kYXJ5QXJ0aWZhY3RzW10gfCBzZWxlY3QoLmFydGlmYWN0SWRlbnRpZmllciA9PSBcIlN5bnRoX19cIikgfCAubG9jYXRpb25cXCcgfCBhd2sgXFwne3N1YihcImFybjphd3M6czM6OjpcIixcInMzOi8vXCIpfTFcXCcgJDFgJyxcbiAgXCJleHBvcnQgU1lOVEhfU09VUkNFX1VSST1gYXdzIGNvZGVidWlsZCBiYXRjaC1nZXQtYnVpbGRzIC0taWRzICRTWU5USF9CVUlMRF9JRCB8IGpxIC1yICcuYnVpbGRzWzBdLnNvdXJjZVZlcnNpb24nIHwgYXdrICd7c3ViKFxcXCJhcm46YXdzOnMzOjo6XFxcIixcXFwiczM6Ly9cXFwiKX0xJyAkMWBcIixcbiAgXCJhd3MgczMgY3AgJFNZTlRIX1NPVVJDRV9VUkkgc291cmNlLnppcFwiLFxuICBcImF3cyBzMyBjcCAkQlVJTFRfQVJUSUZBQ1RfVVJJIGJ1aWx0LnppcFwiLFxuICBcInVuemlwIHNvdXJjZS56aXAgLWQgc3JjXCIsXG4gIFwidW56aXAgYnVpbHQuemlwIC1kIGJ1aWx0XCIsXG4gIFwicm0gc291cmNlLnppcCBidWlsdC56aXBcIixcbiAgYHJzeW5jIC1hIGJ1aWx0Lyogc3JjIC0taW5jbHVkZT1cIiovXCIgJHtcbiAgICBpbmNsdWRlR2xvYnNGb3JTY2FuXG4gICAgICA/IGluY2x1ZGVHbG9ic0ZvclNjYW4ubWFwKChnKSA9PiBgLS1pbmNsdWRlICR7Z31gKS5qb2luKFwiIFwiKVxuICAgICAgOiBcIlwiXG4gIH0gLS1pbmNsdWRlPVwiKiovY292ZXJhZ2UvKipcIiAtLWluY2x1ZGU9XCIqKi9jZGsub3V0LyoqXCIgLS1leGNsdWRlPVwiKiovbm9kZV9tb2R1bGVzLyoqLypcIiAtLWV4Y2x1ZGU9XCIqKi8uZW52LyoqXCIgLS1leGNsdWRlPVwiKlwiIC0tcHJ1bmUtZW1wdHktZGlyc2AsXG5dO1xuXG5jb25zdCBvd2FzcFNjYW4gPSAoKSA9PlxuICBgbnB4IG93YXNwLWRlcGVuZGVuY3ktY2hlY2sgLS1mb3JtYXQgSFRNTCAtLW91dCBzcmMvcmVwb3J0cyAtLWV4Y2x1ZGUgJyoqLy5naXQvKiovKicgLS1zY2FuIHNyYyAtLWVuYWJsZUV4cGVyaW1lbnRhbCAtLWJpbiAvdG1wL2RlcC1jaGVjayAtLWRpc2FibGVSZXRpcmVKU2A7XG5cbmNvbnN0IGNmbk5hZ1NjYW4gPSAoY2RrT3V0RGlyPzogc3RyaW5nLCBjZm5OYWdJZ25vcmVQYXRoPzogc3RyaW5nKSA9PlxuICBjZGtPdXREaXJcbiAgICA/IGBjZm5fbmFnICR7XG4gICAgICAgIGNmbk5hZ0lnbm9yZVBhdGggPyBgLS1kZW55LWxpc3QtcGF0aD0ke2Nmbk5hZ0lnbm9yZVBhdGh9YCA6IFwiXCJcbiAgICAgIH0gYnVpbHQvJHtjZGtPdXREaXJ9LyoqLyoudGVtcGxhdGUuanNvbiAtLW91dHB1dC1mb3JtYXQ9anNvbiA+IHNyYy9yZXBvcnRzL2Nmbi1uYWctcmVwb3J0Lmpzb25gXG4gICAgOiAnZWNobyBcInNraXBwaW5nIGNmbl9uYWcgYXMgbm8gY2RrT3V0RGlyIHdhcyBzcGVjaWZpZWQuJztcblxuZXhwb3J0IGNsYXNzIFNvbmFyQ29kZVNjYW5uZXIgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogU29uYXJDb2RlU2Nhbm5lclByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IHNvbmFyUXViZVRva2VuID0gbmV3IFNlY3JldCh0aGlzLCBcIlNvbmFyUXViZVRva2VuXCIpO1xuXG4gICAgY29uc3Qgc3ludGhCdWlsZFByb2plY3QgPSBQcm9qZWN0LmZyb21Qcm9qZWN0QXJuKFxuICAgICAgdGhpcyxcbiAgICAgIFwiU3ludGhCdWlsZFByb2plY3RcIixcbiAgICAgIHByb3BzLnN5bnRoQnVpbGRBcm5cbiAgICApO1xuXG4gICAgY29uc3QgdmFsaWRhdGlvblByb2plY3QgPSBuZXcgUHJvamVjdCh0aGlzLCBcIlZhbGlkYXRpb25Qcm9qZWN0XCIsIHtcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF81XzAsXG4gICAgICB9LFxuICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHtcbiAgICAgICAgU09OQVJRVUJFX1RPS0VOOiB7XG4gICAgICAgICAgdHlwZTogQnVpbGRFbnZpcm9ubWVudFZhcmlhYmxlVHlwZS5TRUNSRVRTX01BTkFHRVIsXG4gICAgICAgICAgdmFsdWU6IHNvbmFyUXViZVRva2VuLnNlY3JldEFybixcbiAgICAgICAgfSxcbiAgICAgICAgU09OQVJRVUJFX0VORFBPSU5UOiB7XG4gICAgICAgICAgdHlwZTogQnVpbGRFbnZpcm9ubWVudFZhcmlhYmxlVHlwZS5QTEFJTlRFWFQsXG4gICAgICAgICAgdmFsdWU6IHByb3BzLnNvbmFycXViZUVuZHBvaW50LFxuICAgICAgICB9LFxuICAgICAgICBQUk9KRUNUX05BTUU6IHtcbiAgICAgICAgICB0eXBlOiBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLlBMQUlOVEVYVCxcbiAgICAgICAgICB2YWx1ZTogcHJvcHMuc29uYXJxdWJlUHJvamVjdE5hbWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgIHZlcnNpb246IFwiMC4yXCIsXG4gICAgICAgIGVudjoge1xuICAgICAgICAgIHNoZWxsOiBcImJhc2hcIixcbiAgICAgICAgfSxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcIm5wbSBpbnN0YWxsIC1nIGF3cy1jZGtcIiwgXCJnZW0gaW5zdGFsbCBjZm4tbmFnXCJdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgIFwiZXhwb3J0IFJFU09MVkVEX1NPVVJDRV9WRVJTSU9OPWBhd3MgY29kZWJ1aWxkIGJhdGNoLWdldC1idWlsZHMgLS1pZHMgJFNZTlRIX0JVSUxEX0lEIHwganEgLXIgJy5idWlsZHNbMF0ucmVzb2x2ZWRTb3VyY2VWZXJzaW9uJ2BcIixcbiAgICAgICAgICAgICAgLi4udW5wYWNrU291cmNlQW5kQXJ0aWZhY3RzKHByb3BzLmluY2x1ZGVHbG9ic0ZvclNjYW4pLFxuICAgICAgICAgICAgICAuLi5jcmVhdGVTb25hcnF1YmVQcm9qZWN0KHByb3BzKSxcbiAgICAgICAgICAgICAgXCJta2RpciAtcCBzcmMvcmVwb3J0c1wiLFxuICAgICAgICAgICAgICBvd2FzcFNjYW4oKSxcbiAgICAgICAgICAgICAgY2ZuTmFnU2Nhbihwcm9wcy5jZGtPdXREaXIsIHByb3BzLmNmbk5hZ0lnbm9yZVBhdGgpLFxuICAgICAgICAgICAgICBcImNkIHNyY1wiLFxuICAgICAgICAgICAgICBzb25hcnF1YmVTY2FubmVyKHByb3BzLmV4Y2x1ZGVHbG9ic0ZvclNjYW4pLFxuICAgICAgICAgICAgICAuLi5nZW5lcmF0ZVNvbmFycXViZVJlcG9ydHMoKSxcbiAgICAgICAgICAgICAgLi4uKHByb3BzLnByZUFyY2hpdmVDb21tYW5kcyB8fCBbXSksXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIHZhbGlkYXRpb25Qcm9qZWN0LmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbXCJjb2RlYnVpbGQ6QmF0Y2hHZXRCdWlsZHNcIl0sXG4gICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICByZXNvdXJjZXM6IFtzeW50aEJ1aWxkUHJvamVjdC5wcm9qZWN0QXJuXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHZhbGlkYXRpb25Qcm9qZWN0LmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbXCJzMzpHZXRPYmplY3QqXCJdLFxuICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgcmVzb3VyY2VzOiBbcHJvcHMuYXJ0aWZhY3RCdWNrZXRBcm4sIGAke3Byb3BzLmFydGlmYWN0QnVja2V0QXJufS8qKmBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgcHJvcHMuYXJ0aWZhY3RCdWNrZXRLZXlBcm4gJiZcbiAgICAgIHZhbGlkYXRpb25Qcm9qZWN0LmFkZFRvUm9sZVBvbGljeShcbiAgICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgYWN0aW9uczogW1wia21zOkRlY3J5cHRcIiwgXCJrbXM6RGVzY3JpYmVLZXlcIl0sXG4gICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgICAgcmVzb3VyY2VzOiBbcHJvcHMuYXJ0aWZhY3RCdWNrZXRLZXlBcm5dLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIHN5bnRoQnVpbGRQcm9qZWN0Lm9uQnVpbGRTdWNjZWVkZWQoXCJPblN5bnRoU3VjY2Vzc1wiLCB7XG4gICAgICB0YXJnZXQ6IG5ldyBDb2RlQnVpbGRQcm9qZWN0KHZhbGlkYXRpb25Qcm9qZWN0LCB7XG4gICAgICAgIGV2ZW50OiBSdWxlVGFyZ2V0SW5wdXQuZnJvbU9iamVjdCh7XG4gICAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXNPdmVycmlkZTogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBuYW1lOiBcIlNZTlRIX0JVSUxEX0lEXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiUExBSU5URVhUXCIsXG4gICAgICAgICAgICAgIHZhbHVlOiBFdmVudEZpZWxkLmZyb21QYXRoKFwiJC5kZXRhaWwuYnVpbGQtaWRcIiksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsIFwiU29uYXJxdWJlU2VjcmV0QXJuXCIsIHtcbiAgICAgIGV4cG9ydE5hbWU6IFwiU29uYXJxdWJlU2VjcmV0QXJuXCIsXG4gICAgICB2YWx1ZTogc29uYXJRdWJlVG9rZW4uc2VjcmV0QXJuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=