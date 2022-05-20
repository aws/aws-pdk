"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipeline = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_codecommit_1 = require("aws-cdk-lib/aws-codecommit");
const pipelines_1 = require("aws-cdk-lib/pipelines");
const sonar_code_scanner_1 = require("./code_scanner/sonar-code-scanner");
__exportStar(require("./code_scanner/sonar-code-scanner"), exports);
const DEFAULT_BRANCH_NAME = "mainline";
/**
 * An extension to CodePipeline which configures sane defaults for a NX Monorepo
 * codebase. In addition to this, it also creates a CodeCommit repository with
 * automated PR builds and approvals.
 */
class PDKPipeline extends pipelines_1.CodePipeline {
    constructor(scope, id, props) {
        var _a;
        const codeRepository = new aws_codecommit_1.Repository(scope, "CodeRepository", {
            repositoryName: props.repositoryName,
        });
        codeRepository.applyRemovalPolicy((_a = props.codeCommitRemovalPolicy) !== null && _a !== void 0 ? _a : aws_cdk_lib_1.RemovalPolicy.RETAIN);
        // ignore input and primaryOutputDirectory
        const { input, primaryOutputDirectory, commands, ...synthShellStepPartialProps } = props.synthShellStepPartialProps || {};
        const synthShellStep = new pipelines_1.ShellStep("Synth", {
            input: pipelines_1.CodePipelineSource.codeCommit(codeRepository, props.defaultBranchName || DEFAULT_BRANCH_NAME),
            installCommands: ["yarn install --frozen-lockfile"],
            commands: commands && commands.length > 0
                ? commands
                : ["npx nx run-many --target=build --all"],
            primaryOutputDirectory: props.primarySynthDirectory,
            ...(synthShellStepPartialProps || {}),
        });
        synthShellStep.addOutputDirectory(".");
        const codePipelineProps = {
            ...props,
            synth: synthShellStep,
        };
        super(scope, id, codePipelineProps);
        this.codeRepository = codeRepository;
        this.sonarCodeScannerConfig = props.sonarCodeScannerConfig
            ? {
                cdkOutDir: props.primarySynthDirectory,
                ...props.sonarCodeScannerConfig,
            }
            : undefined;
        new aws_cdk_lib_1.CfnOutput(scope, "CodeRepositoryGRCUrl", {
            exportName: "CodeRepositoryGRCUrl",
            value: this.codeRepository.repositoryCloneUrlGrc,
        });
    }
    buildPipeline() {
        var _a;
        super.buildPipeline();
        this.sonarCodeScannerConfig &&
            new sonar_code_scanner_1.SonarCodeScanner(this, "SonarCodeScanner", {
                artifactBucketArn: this.pipeline.artifactBucket.bucketArn,
                artifactBucketKeyArn: (_a = this.pipeline.artifactBucket.encryptionKey) === null || _a === void 0 ? void 0 : _a.keyArn,
                synthBuildArn: this.synthProject.projectArn,
                ...this.sonarCodeScannerConfig,
            });
    }
}
exports.PDKPipeline = PDKPipeline;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGRrLXBpcGVsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxRUFBcUU7QUFDckUsc0NBQXNDOzs7Ozs7Ozs7Ozs7O0FBRXRDLDZDQUF1RDtBQUN2RCwrREFBd0Q7QUFDeEQscURBTStCO0FBRS9CLDBFQUcyQztBQUUzQyxvRUFBa0Q7QUFFbEQsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUM7QUFxRHZDOzs7O0dBSUc7QUFDSCxNQUFhLFdBQVksU0FBUSx3QkFBWTtJQUkzQyxZQUFtQixLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF1Qjs7UUFDdEUsTUFBTSxjQUFjLEdBQUcsSUFBSSwyQkFBVSxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRTtZQUM3RCxjQUFjLEVBQUUsS0FBSyxDQUFDLGNBQWM7U0FDckMsQ0FBQyxDQUFDO1FBQ0gsY0FBYyxDQUFDLGtCQUFrQixPQUMvQixLQUFLLENBQUMsdUJBQXVCLG1DQUFJLDJCQUFhLENBQUMsTUFBTSxDQUN0RCxDQUFDO1FBRUYsMENBQTBDO1FBQzFDLE1BQU0sRUFDSixLQUFLLEVBQ0wsc0JBQXNCLEVBQ3RCLFFBQVEsRUFDUixHQUFHLDBCQUEwQixFQUM5QixHQUFHLEtBQUssQ0FBQywwQkFBMEIsSUFBSSxFQUFFLENBQUM7UUFFM0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxxQkFBUyxDQUFDLE9BQU8sRUFBRTtZQUM1QyxLQUFLLEVBQUUsOEJBQWtCLENBQUMsVUFBVSxDQUNsQyxjQUFjLEVBQ2QsS0FBSyxDQUFDLGlCQUFpQixJQUFJLG1CQUFtQixDQUMvQztZQUNELGVBQWUsRUFBRSxDQUFDLGdDQUFnQyxDQUFDO1lBQ25ELFFBQVEsRUFDTixRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUM3QixDQUFDLENBQUMsUUFBUTtnQkFDVixDQUFDLENBQUMsQ0FBQyxzQ0FBc0MsQ0FBQztZQUM5QyxzQkFBc0IsRUFBRSxLQUFLLENBQUMscUJBQXFCO1lBQ25ELEdBQUcsQ0FBQywwQkFBMEIsSUFBSSxFQUFFLENBQUM7U0FDdEMsQ0FBQyxDQUFDO1FBRUgsY0FBYyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXZDLE1BQU0saUJBQWlCLEdBQXNCO1lBQzNDLEdBQUcsS0FBSztZQUNSLEtBQUssRUFBRSxjQUFjO1NBQ3RCLENBQUM7UUFFRixLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBRXBDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUMsc0JBQXNCO1lBQ3hELENBQUMsQ0FBQztnQkFDRSxTQUFTLEVBQUUsS0FBSyxDQUFDLHFCQUFxQjtnQkFDdEMsR0FBRyxLQUFLLENBQUMsc0JBQXNCO2FBQ2hDO1lBQ0gsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUVkLElBQUksdUJBQVMsQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0MsVUFBVSxFQUFFLHNCQUFzQjtZQUNsQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUI7U0FDakQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGFBQWE7O1FBQ1gsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXRCLElBQUksQ0FBQyxzQkFBc0I7WUFDekIsSUFBSSxxQ0FBZ0IsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7Z0JBQzdDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVM7Z0JBQ3pELG9CQUFvQixRQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLDBDQUFFLE1BQU07Z0JBQ3BELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVU7Z0JBQzNDLEdBQUcsSUFBSSxDQUFDLHNCQUFzQjthQUMvQixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0Y7QUFyRUQsa0NBcUVDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxuXG5pbXBvcnQgeyBDZm5PdXRwdXQsIFJlbW92YWxQb2xpY3kgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7IFJlcG9zaXRvcnkgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVjb21taXRcIjtcbmltcG9ydCB7XG4gIENvZGVQaXBlbGluZSxcbiAgQ29kZVBpcGVsaW5lUHJvcHMsXG4gIENvZGVQaXBlbGluZVNvdXJjZSxcbiAgU2hlbGxTdGVwLFxuICBTaGVsbFN0ZXBQcm9wcyxcbn0gZnJvbSBcImF3cy1jZGstbGliL3BpcGVsaW5lc1wiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCB7XG4gIFNvbmFyQ29kZVNjYW5uZXIsXG4gIFNvbmFyQ29kZVNjYW5uZXJDb25maWcsXG59IGZyb20gXCIuL2NvZGVfc2Nhbm5lci9zb25hci1jb2RlLXNjYW5uZXJcIjtcblxuZXhwb3J0ICogZnJvbSBcIi4vY29kZV9zY2FubmVyL3NvbmFyLWNvZGUtc2Nhbm5lclwiO1xuXG5jb25zdCBERUZBVUxUX0JSQU5DSF9OQU1FID0gXCJtYWlubGluZVwiO1xuXG4vKipcbiAqIFByb3BlcnRpZXMgdG8gY29uZmlndXJlIHRoZSBQREtQaXBlbGluZS5cbiAqXG4gKiBOb3RlOiBEdWUgdG8gbGltaXRhdGlvbnMgd2l0aCBKU0lJIGFuZCBnZW5lcmljIHN1cHBvcnQgaXQgc2hvdWxkIGJlIG5vdGVkIHRoYXRcbiAqIHRoZSBzeW50aCwgc3ludGhTaGVsbFN0ZXBQYXJ0aWFsUHJvcHMuaW5wdXQgYW5kXG4gKiBzeW50aFNoZWxsU3RlcFBhcnRpYWxQcm9wcy5wcmltYXJ5T3V0cHV0RGlyZWN0b3J5IHByb3BlcnRpZXMgd2lsbCBiZSBpZ25vcmVkXG4gKiBpZiBwYXNzZWQgaW4gdG8gdGhpcyBjb25zdHJ1Y3QuXG4gKlxuICogc3ludGhTaGVsbFN0ZXBQYXJ0aWFsUHJvcHMuY29tbWFuZHMgaXMgbWFya2VkIGFzIGEgcmVxdWlyZWQgZmllbGQsIGhvd2V2ZXJcbiAqIGlmIHlvdSBwYXNzIGluIFtdIHRoZSBkZWZhdWx0IGNvbW1hbmRzIG9mIHRoaXMgY29uc3RydWN0IHdpbGwgYmUgcmV0YWluZWQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUERLUGlwZWxpbmVQcm9wcyBleHRlbmRzIENvZGVQaXBlbGluZVByb3BzIHtcbiAgLyoqXG4gICAqIE5hbWUgb2YgdGhlIENvZGVDb21taXQgcmVwb3NpdG9yeSB0byBjcmVhdGUuXG4gICAqL1xuICByZWFkb25seSByZXBvc2l0b3J5TmFtZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBPdXRwdXQgZGlyZWN0b3J5IGZvciBjZGsgc3ludGhlc2l6ZWQgYXJ0aWZhY3RzIGkuZTogcGFja2FnZXMvaW5mcmEvY2RrLm91dC5cbiAgICovXG4gIHJlYWRvbmx5IHByaW1hcnlTeW50aERpcmVjdG9yeTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBQREtQaXBlbGluZSBieSBkZWZhdWx0IGFzc3VtZXMgYSBOWCBNb25vcmVwbyBzdHJ1Y3R1cmUgZm9yIGl0J3MgY29kZWJhc2UgYW5kXG4gICAqIHVzZXMgc2FuZSBkZWZhdWx0cyBmb3IgdGhlIGluc3RhbGwgYW5kIHJ1biBjb21tYW5kcy4gVG8gb3ZlcnJpZGUgdGhlc2UgZGVmYXVsdHNcbiAgICogYW5kL29yIHByb3ZpZGUgYWRkaXRpb25hbCBpbnB1dHMsIHNwZWNpZnkgZW52IHNldHRpbmdzLCBldGMgeW91IGNhbiBwcm92aWRlXG4gICAqIGEgcGFydGlhbCBTaGVsbFN0ZXBQcm9wcy5cbiAgICovXG4gIHJlYWRvbmx5IHN5bnRoU2hlbGxTdGVwUGFydGlhbFByb3BzPzogU2hlbGxTdGVwUHJvcHM7XG5cbiAgLyoqXG4gICAqIEJyYW5jaCB0byB0cmlnZ2VyIHRoZSBwaXBlbGluZSBleGVjdXRpb24uXG4gICAqXG4gICAqIEBkZWZhdWx0IG1haW5saW5lXG4gICAqL1xuICByZWFkb25seSBkZWZhdWx0QnJhbmNoTmFtZT86IHN0cmluZztcblxuICAvKipcbiAgICogQ29uZmlndXJhdGlvbiBmb3IgZW5hYmxpbmcgU29uYXJxdWJlIGNvZGUgc2Nhbm5pbmcgb24gYSBzdWNjZXNzZnVsIHN5bnRoLlxuICAgKlxuICAgKiBAZGVmYXVsdCB1bmRlZmluZWRcbiAgICovXG4gIHJlYWRvbmx5IHNvbmFyQ29kZVNjYW5uZXJDb25maWc/OiBTb25hckNvZGVTY2FubmVyQ29uZmlnO1xuXG4gIC8qKlxuICAgKiBQb3NzaWJsZSB2YWx1ZXMgZm9yIGEgcmVzb3VyY2UncyBSZW1vdmFsIFBvbGljeVxuICAgKiBUaGUgcmVtb3ZhbCBwb2xpY3kgY29udHJvbHMgd2hhdCBoYXBwZW5zIHRvIHRoZSByZXNvdXJjZSBpZiBpdCBzdG9wcyBiZWluZyBtYW5hZ2VkIGJ5IENsb3VkRm9ybWF0aW9uLlxuICAgKi9cbiAgcmVhZG9ubHkgY29kZUNvbW1pdFJlbW92YWxQb2xpY3k/OiBSZW1vdmFsUG9saWN5O1xufVxuXG4vKipcbiAqIEFuIGV4dGVuc2lvbiB0byBDb2RlUGlwZWxpbmUgd2hpY2ggY29uZmlndXJlcyBzYW5lIGRlZmF1bHRzIGZvciBhIE5YIE1vbm9yZXBvXG4gKiBjb2RlYmFzZS4gSW4gYWRkaXRpb24gdG8gdGhpcywgaXQgYWxzbyBjcmVhdGVzIGEgQ29kZUNvbW1pdCByZXBvc2l0b3J5IHdpdGhcbiAqIGF1dG9tYXRlZCBQUiBidWlsZHMgYW5kIGFwcHJvdmFscy5cbiAqL1xuZXhwb3J0IGNsYXNzIFBES1BpcGVsaW5lIGV4dGVuZHMgQ29kZVBpcGVsaW5lIHtcbiAgcmVhZG9ubHkgY29kZVJlcG9zaXRvcnk6IFJlcG9zaXRvcnk7XG4gIHByaXZhdGUgcmVhZG9ubHkgc29uYXJDb2RlU2Nhbm5lckNvbmZpZz86IFNvbmFyQ29kZVNjYW5uZXJDb25maWc7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBQREtQaXBlbGluZVByb3BzKSB7XG4gICAgY29uc3QgY29kZVJlcG9zaXRvcnkgPSBuZXcgUmVwb3NpdG9yeShzY29wZSwgXCJDb2RlUmVwb3NpdG9yeVwiLCB7XG4gICAgICByZXBvc2l0b3J5TmFtZTogcHJvcHMucmVwb3NpdG9yeU5hbWUsXG4gICAgfSk7XG4gICAgY29kZVJlcG9zaXRvcnkuYXBwbHlSZW1vdmFsUG9saWN5KFxuICAgICAgcHJvcHMuY29kZUNvbW1pdFJlbW92YWxQb2xpY3kgPz8gUmVtb3ZhbFBvbGljeS5SRVRBSU5cbiAgICApO1xuXG4gICAgLy8gaWdub3JlIGlucHV0IGFuZCBwcmltYXJ5T3V0cHV0RGlyZWN0b3J5XG4gICAgY29uc3Qge1xuICAgICAgaW5wdXQsXG4gICAgICBwcmltYXJ5T3V0cHV0RGlyZWN0b3J5LFxuICAgICAgY29tbWFuZHMsXG4gICAgICAuLi5zeW50aFNoZWxsU3RlcFBhcnRpYWxQcm9wc1xuICAgIH0gPSBwcm9wcy5zeW50aFNoZWxsU3RlcFBhcnRpYWxQcm9wcyB8fCB7fTtcblxuICAgIGNvbnN0IHN5bnRoU2hlbGxTdGVwID0gbmV3IFNoZWxsU3RlcChcIlN5bnRoXCIsIHtcbiAgICAgIGlucHV0OiBDb2RlUGlwZWxpbmVTb3VyY2UuY29kZUNvbW1pdChcbiAgICAgICAgY29kZVJlcG9zaXRvcnksXG4gICAgICAgIHByb3BzLmRlZmF1bHRCcmFuY2hOYW1lIHx8IERFRkFVTFRfQlJBTkNIX05BTUVcbiAgICAgICksXG4gICAgICBpbnN0YWxsQ29tbWFuZHM6IFtcInlhcm4gaW5zdGFsbCAtLWZyb3plbi1sb2NrZmlsZVwiXSxcbiAgICAgIGNvbW1hbmRzOlxuICAgICAgICBjb21tYW5kcyAmJiBjb21tYW5kcy5sZW5ndGggPiAwXG4gICAgICAgICAgPyBjb21tYW5kc1xuICAgICAgICAgIDogW1wibnB4IG54IHJ1bi1tYW55IC0tdGFyZ2V0PWJ1aWxkIC0tYWxsXCJdLFxuICAgICAgcHJpbWFyeU91dHB1dERpcmVjdG9yeTogcHJvcHMucHJpbWFyeVN5bnRoRGlyZWN0b3J5LFxuICAgICAgLi4uKHN5bnRoU2hlbGxTdGVwUGFydGlhbFByb3BzIHx8IHt9KSxcbiAgICB9KTtcblxuICAgIHN5bnRoU2hlbGxTdGVwLmFkZE91dHB1dERpcmVjdG9yeShcIi5cIik7XG5cbiAgICBjb25zdCBjb2RlUGlwZWxpbmVQcm9wczogQ29kZVBpcGVsaW5lUHJvcHMgPSB7XG4gICAgICAuLi5wcm9wcyxcbiAgICAgIHN5bnRoOiBzeW50aFNoZWxsU3RlcCxcbiAgICB9O1xuXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBjb2RlUGlwZWxpbmVQcm9wcyk7XG5cbiAgICB0aGlzLmNvZGVSZXBvc2l0b3J5ID0gY29kZVJlcG9zaXRvcnk7XG4gICAgdGhpcy5zb25hckNvZGVTY2FubmVyQ29uZmlnID0gcHJvcHMuc29uYXJDb2RlU2Nhbm5lckNvbmZpZ1xuICAgICAgPyB7XG4gICAgICAgICAgY2RrT3V0RGlyOiBwcm9wcy5wcmltYXJ5U3ludGhEaXJlY3RvcnksXG4gICAgICAgICAgLi4ucHJvcHMuc29uYXJDb2RlU2Nhbm5lckNvbmZpZyxcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICBuZXcgQ2ZuT3V0cHV0KHNjb3BlLCBcIkNvZGVSZXBvc2l0b3J5R1JDVXJsXCIsIHtcbiAgICAgIGV4cG9ydE5hbWU6IFwiQ29kZVJlcG9zaXRvcnlHUkNVcmxcIixcbiAgICAgIHZhbHVlOiB0aGlzLmNvZGVSZXBvc2l0b3J5LnJlcG9zaXRvcnlDbG9uZVVybEdyYyxcbiAgICB9KTtcbiAgfVxuXG4gIGJ1aWxkUGlwZWxpbmUoKSB7XG4gICAgc3VwZXIuYnVpbGRQaXBlbGluZSgpO1xuXG4gICAgdGhpcy5zb25hckNvZGVTY2FubmVyQ29uZmlnICYmXG4gICAgICBuZXcgU29uYXJDb2RlU2Nhbm5lcih0aGlzLCBcIlNvbmFyQ29kZVNjYW5uZXJcIiwge1xuICAgICAgICBhcnRpZmFjdEJ1Y2tldEFybjogdGhpcy5waXBlbGluZS5hcnRpZmFjdEJ1Y2tldC5idWNrZXRBcm4sXG4gICAgICAgIGFydGlmYWN0QnVja2V0S2V5QXJuOlxuICAgICAgICAgIHRoaXMucGlwZWxpbmUuYXJ0aWZhY3RCdWNrZXQuZW5jcnlwdGlvbktleT8ua2V5QXJuLFxuICAgICAgICBzeW50aEJ1aWxkQXJuOiB0aGlzLnN5bnRoUHJvamVjdC5wcm9qZWN0QXJuLFxuICAgICAgICAuLi50aGlzLnNvbmFyQ29kZVNjYW5uZXJDb25maWcsXG4gICAgICB9KTtcbiAgfVxufVxuIl19