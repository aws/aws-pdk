"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDKPipeline = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
        var _b;
        const codeRepository = new aws_codecommit_1.Repository(scope, "CodeRepository", {
            repositoryName: props.repositoryName,
        });
        codeRepository.applyRemovalPolicy((_b = props.codeCommitRemovalPolicy) !== null && _b !== void 0 ? _b : aws_cdk_lib_1.RemovalPolicy.RETAIN);
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
        var _b;
        super.buildPipeline();
        this.sonarCodeScannerConfig &&
            new sonar_code_scanner_1.SonarCodeScanner(this, "SonarCodeScanner", {
                artifactBucketArn: this.pipeline.artifactBucket.bucketArn,
                artifactBucketKeyArn: (_b = this.pipeline.artifactBucket.encryptionKey) === null || _b === void 0 ? void 0 : _b.keyArn,
                synthBuildArn: this.synthProject.projectArn,
                ...this.sonarCodeScannerConfig,
            });
    }
}
exports.PDKPipeline = PDKPipeline;
_a = JSII_RTTI_SYMBOL_1;
PDKPipeline[_a] = { fqn: "@aws/aws-pdk-pipeline.PDKPipeline", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRrLXBpcGVsaW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Bkay1waXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxxRUFBcUU7QUFDckUsc0NBQXNDO0FBRXRDLDZDQUF1RDtBQUN2RCwrREFBd0Q7QUFDeEQscURBTStCO0FBRS9CLDBFQUcyQztBQUUzQyxvRUFBa0Q7QUFFbEQsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUM7QUFxRHZDOzs7O0dBSUc7QUFDSCxNQUFhLFdBQVksU0FBUSx3QkFBWTtJQUkzQyxZQUFtQixLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF1Qjs7UUFDdEUsTUFBTSxjQUFjLEdBQUcsSUFBSSwyQkFBVSxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRTtZQUM3RCxjQUFjLEVBQUUsS0FBSyxDQUFDLGNBQWM7U0FDckMsQ0FBQyxDQUFDO1FBQ0gsY0FBYyxDQUFDLGtCQUFrQixPQUMvQixLQUFLLENBQUMsdUJBQXVCLG1DQUFJLDJCQUFhLENBQUMsTUFBTSxDQUN0RCxDQUFDO1FBRUYsMENBQTBDO1FBQzFDLE1BQU0sRUFDSixLQUFLLEVBQ0wsc0JBQXNCLEVBQ3RCLFFBQVEsRUFDUixHQUFHLDBCQUEwQixFQUM5QixHQUFHLEtBQUssQ0FBQywwQkFBMEIsSUFBSSxFQUFFLENBQUM7UUFFM0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxxQkFBUyxDQUFDLE9BQU8sRUFBRTtZQUM1QyxLQUFLLEVBQUUsOEJBQWtCLENBQUMsVUFBVSxDQUNsQyxjQUFjLEVBQ2QsS0FBSyxDQUFDLGlCQUFpQixJQUFJLG1CQUFtQixDQUMvQztZQUNELGVBQWUsRUFBRSxDQUFDLGdDQUFnQyxDQUFDO1lBQ25ELFFBQVEsRUFDTixRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUM3QixDQUFDLENBQUMsUUFBUTtnQkFDVixDQUFDLENBQUMsQ0FBQyxzQ0FBc0MsQ0FBQztZQUM5QyxzQkFBc0IsRUFBRSxLQUFLLENBQUMscUJBQXFCO1lBQ25ELEdBQUcsQ0FBQywwQkFBMEIsSUFBSSxFQUFFLENBQUM7U0FDdEMsQ0FBQyxDQUFDO1FBRUgsY0FBYyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXZDLE1BQU0saUJBQWlCLEdBQXNCO1lBQzNDLEdBQUcsS0FBSztZQUNSLEtBQUssRUFBRSxjQUFjO1NBQ3RCLENBQUM7UUFFRixLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBRXBDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxLQUFLLENBQUMsc0JBQXNCO1lBQ3hELENBQUMsQ0FBQztnQkFDRSxTQUFTLEVBQUUsS0FBSyxDQUFDLHFCQUFxQjtnQkFDdEMsR0FBRyxLQUFLLENBQUMsc0JBQXNCO2FBQ2hDO1lBQ0gsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUVkLElBQUksdUJBQVMsQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLEVBQUU7WUFDM0MsVUFBVSxFQUFFLHNCQUFzQjtZQUNsQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUI7U0FDakQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGFBQWE7O1FBQ1gsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRXRCLElBQUksQ0FBQyxzQkFBc0I7WUFDekIsSUFBSSxxQ0FBZ0IsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7Z0JBQzdDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVM7Z0JBQ3pELG9CQUFvQixRQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLDBDQUFFLE1BQU07Z0JBQ3BELGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVU7Z0JBQzNDLEdBQUcsSUFBSSxDQUFDLHNCQUFzQjthQUMvQixDQUFDLENBQUM7SUFDUCxDQUFDOztBQXBFSCxrQ0FxRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG5cbmltcG9ydCB7IENmbk91dHB1dCwgUmVtb3ZhbFBvbGljeSB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHsgUmVwb3NpdG9yeSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29kZWNvbW1pdFwiO1xuaW1wb3J0IHtcbiAgQ29kZVBpcGVsaW5lLFxuICBDb2RlUGlwZWxpbmVQcm9wcyxcbiAgQ29kZVBpcGVsaW5lU291cmNlLFxuICBTaGVsbFN0ZXAsXG4gIFNoZWxsU3RlcFByb3BzLFxufSBmcm9tIFwiYXdzLWNkay1saWIvcGlwZWxpbmVzXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0IHtcbiAgU29uYXJDb2RlU2Nhbm5lcixcbiAgU29uYXJDb2RlU2Nhbm5lckNvbmZpZyxcbn0gZnJvbSBcIi4vY29kZV9zY2FubmVyL3NvbmFyLWNvZGUtc2Nhbm5lclwiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi9jb2RlX3NjYW5uZXIvc29uYXItY29kZS1zY2FubmVyXCI7XG5cbmNvbnN0IERFRkFVTFRfQlJBTkNIX05BTUUgPSBcIm1haW5saW5lXCI7XG5cbi8qKlxuICogUHJvcGVydGllcyB0byBjb25maWd1cmUgdGhlIFBES1BpcGVsaW5lLlxuICpcbiAqIE5vdGU6IER1ZSB0byBsaW1pdGF0aW9ucyB3aXRoIEpTSUkgYW5kIGdlbmVyaWMgc3VwcG9ydCBpdCBzaG91bGQgYmUgbm90ZWQgdGhhdFxuICogdGhlIHN5bnRoLCBzeW50aFNoZWxsU3RlcFBhcnRpYWxQcm9wcy5pbnB1dCBhbmRcbiAqIHN5bnRoU2hlbGxTdGVwUGFydGlhbFByb3BzLnByaW1hcnlPdXRwdXREaXJlY3RvcnkgcHJvcGVydGllcyB3aWxsIGJlIGlnbm9yZWRcbiAqIGlmIHBhc3NlZCBpbiB0byB0aGlzIGNvbnN0cnVjdC5cbiAqXG4gKiBzeW50aFNoZWxsU3RlcFBhcnRpYWxQcm9wcy5jb21tYW5kcyBpcyBtYXJrZWQgYXMgYSByZXF1aXJlZCBmaWVsZCwgaG93ZXZlclxuICogaWYgeW91IHBhc3MgaW4gW10gdGhlIGRlZmF1bHQgY29tbWFuZHMgb2YgdGhpcyBjb25zdHJ1Y3Qgd2lsbCBiZSByZXRhaW5lZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQREtQaXBlbGluZVByb3BzIGV4dGVuZHMgQ29kZVBpcGVsaW5lUHJvcHMge1xuICAvKipcbiAgICogTmFtZSBvZiB0aGUgQ29kZUNvbW1pdCByZXBvc2l0b3J5IHRvIGNyZWF0ZS5cbiAgICovXG4gIHJlYWRvbmx5IHJlcG9zaXRvcnlOYW1lOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE91dHB1dCBkaXJlY3RvcnkgZm9yIGNkayBzeW50aGVzaXplZCBhcnRpZmFjdHMgaS5lOiBwYWNrYWdlcy9pbmZyYS9jZGsub3V0LlxuICAgKi9cbiAgcmVhZG9ubHkgcHJpbWFyeVN5bnRoRGlyZWN0b3J5OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFBES1BpcGVsaW5lIGJ5IGRlZmF1bHQgYXNzdW1lcyBhIE5YIE1vbm9yZXBvIHN0cnVjdHVyZSBmb3IgaXQncyBjb2RlYmFzZSBhbmRcbiAgICogdXNlcyBzYW5lIGRlZmF1bHRzIGZvciB0aGUgaW5zdGFsbCBhbmQgcnVuIGNvbW1hbmRzLiBUbyBvdmVycmlkZSB0aGVzZSBkZWZhdWx0c1xuICAgKiBhbmQvb3IgcHJvdmlkZSBhZGRpdGlvbmFsIGlucHV0cywgc3BlY2lmeSBlbnYgc2V0dGluZ3MsIGV0YyB5b3UgY2FuIHByb3ZpZGVcbiAgICogYSBwYXJ0aWFsIFNoZWxsU3RlcFByb3BzLlxuICAgKi9cbiAgcmVhZG9ubHkgc3ludGhTaGVsbFN0ZXBQYXJ0aWFsUHJvcHM/OiBTaGVsbFN0ZXBQcm9wcztcblxuICAvKipcbiAgICogQnJhbmNoIHRvIHRyaWdnZXIgdGhlIHBpcGVsaW5lIGV4ZWN1dGlvbi5cbiAgICpcbiAgICogQGRlZmF1bHQgbWFpbmxpbmVcbiAgICovXG4gIHJlYWRvbmx5IGRlZmF1bHRCcmFuY2hOYW1lPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIGZvciBlbmFibGluZyBTb25hcnF1YmUgY29kZSBzY2FubmluZyBvbiBhIHN1Y2Nlc3NmdWwgc3ludGguXG4gICAqXG4gICAqIEBkZWZhdWx0IHVuZGVmaW5lZFxuICAgKi9cbiAgcmVhZG9ubHkgc29uYXJDb2RlU2Nhbm5lckNvbmZpZz86IFNvbmFyQ29kZVNjYW5uZXJDb25maWc7XG5cbiAgLyoqXG4gICAqIFBvc3NpYmxlIHZhbHVlcyBmb3IgYSByZXNvdXJjZSdzIFJlbW92YWwgUG9saWN5XG4gICAqIFRoZSByZW1vdmFsIHBvbGljeSBjb250cm9scyB3aGF0IGhhcHBlbnMgdG8gdGhlIHJlc291cmNlIGlmIGl0IHN0b3BzIGJlaW5nIG1hbmFnZWQgYnkgQ2xvdWRGb3JtYXRpb24uXG4gICAqL1xuICByZWFkb25seSBjb2RlQ29tbWl0UmVtb3ZhbFBvbGljeT86IFJlbW92YWxQb2xpY3k7XG59XG5cbi8qKlxuICogQW4gZXh0ZW5zaW9uIHRvIENvZGVQaXBlbGluZSB3aGljaCBjb25maWd1cmVzIHNhbmUgZGVmYXVsdHMgZm9yIGEgTlggTW9ub3JlcG9cbiAqIGNvZGViYXNlLiBJbiBhZGRpdGlvbiB0byB0aGlzLCBpdCBhbHNvIGNyZWF0ZXMgYSBDb2RlQ29tbWl0IHJlcG9zaXRvcnkgd2l0aFxuICogYXV0b21hdGVkIFBSIGJ1aWxkcyBhbmQgYXBwcm92YWxzLlxuICovXG5leHBvcnQgY2xhc3MgUERLUGlwZWxpbmUgZXh0ZW5kcyBDb2RlUGlwZWxpbmUge1xuICByZWFkb25seSBjb2RlUmVwb3NpdG9yeTogUmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSByZWFkb25seSBzb25hckNvZGVTY2FubmVyQ29uZmlnPzogU29uYXJDb2RlU2Nhbm5lckNvbmZpZztcblxuICBwdWJsaWMgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFBES1BpcGVsaW5lUHJvcHMpIHtcbiAgICBjb25zdCBjb2RlUmVwb3NpdG9yeSA9IG5ldyBSZXBvc2l0b3J5KHNjb3BlLCBcIkNvZGVSZXBvc2l0b3J5XCIsIHtcbiAgICAgIHJlcG9zaXRvcnlOYW1lOiBwcm9wcy5yZXBvc2l0b3J5TmFtZSxcbiAgICB9KTtcbiAgICBjb2RlUmVwb3NpdG9yeS5hcHBseVJlbW92YWxQb2xpY3koXG4gICAgICBwcm9wcy5jb2RlQ29tbWl0UmVtb3ZhbFBvbGljeSA/PyBSZW1vdmFsUG9saWN5LlJFVEFJTlxuICAgICk7XG5cbiAgICAvLyBpZ25vcmUgaW5wdXQgYW5kIHByaW1hcnlPdXRwdXREaXJlY3RvcnlcbiAgICBjb25zdCB7XG4gICAgICBpbnB1dCxcbiAgICAgIHByaW1hcnlPdXRwdXREaXJlY3RvcnksXG4gICAgICBjb21tYW5kcyxcbiAgICAgIC4uLnN5bnRoU2hlbGxTdGVwUGFydGlhbFByb3BzXG4gICAgfSA9IHByb3BzLnN5bnRoU2hlbGxTdGVwUGFydGlhbFByb3BzIHx8IHt9O1xuXG4gICAgY29uc3Qgc3ludGhTaGVsbFN0ZXAgPSBuZXcgU2hlbGxTdGVwKFwiU3ludGhcIiwge1xuICAgICAgaW5wdXQ6IENvZGVQaXBlbGluZVNvdXJjZS5jb2RlQ29tbWl0KFxuICAgICAgICBjb2RlUmVwb3NpdG9yeSxcbiAgICAgICAgcHJvcHMuZGVmYXVsdEJyYW5jaE5hbWUgfHwgREVGQVVMVF9CUkFOQ0hfTkFNRVxuICAgICAgKSxcbiAgICAgIGluc3RhbGxDb21tYW5kczogW1wieWFybiBpbnN0YWxsIC0tZnJvemVuLWxvY2tmaWxlXCJdLFxuICAgICAgY29tbWFuZHM6XG4gICAgICAgIGNvbW1hbmRzICYmIGNvbW1hbmRzLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IGNvbW1hbmRzXG4gICAgICAgICAgOiBbXCJucHggbnggcnVuLW1hbnkgLS10YXJnZXQ9YnVpbGQgLS1hbGxcIl0sXG4gICAgICBwcmltYXJ5T3V0cHV0RGlyZWN0b3J5OiBwcm9wcy5wcmltYXJ5U3ludGhEaXJlY3RvcnksXG4gICAgICAuLi4oc3ludGhTaGVsbFN0ZXBQYXJ0aWFsUHJvcHMgfHwge30pLFxuICAgIH0pO1xuXG4gICAgc3ludGhTaGVsbFN0ZXAuYWRkT3V0cHV0RGlyZWN0b3J5KFwiLlwiKTtcblxuICAgIGNvbnN0IGNvZGVQaXBlbGluZVByb3BzOiBDb2RlUGlwZWxpbmVQcm9wcyA9IHtcbiAgICAgIC4uLnByb3BzLFxuICAgICAgc3ludGg6IHN5bnRoU2hlbGxTdGVwLFxuICAgIH07XG5cbiAgICBzdXBlcihzY29wZSwgaWQsIGNvZGVQaXBlbGluZVByb3BzKTtcblxuICAgIHRoaXMuY29kZVJlcG9zaXRvcnkgPSBjb2RlUmVwb3NpdG9yeTtcbiAgICB0aGlzLnNvbmFyQ29kZVNjYW5uZXJDb25maWcgPSBwcm9wcy5zb25hckNvZGVTY2FubmVyQ29uZmlnXG4gICAgICA/IHtcbiAgICAgICAgICBjZGtPdXREaXI6IHByb3BzLnByaW1hcnlTeW50aERpcmVjdG9yeSxcbiAgICAgICAgICAuLi5wcm9wcy5zb25hckNvZGVTY2FubmVyQ29uZmlnLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZDtcblxuICAgIG5ldyBDZm5PdXRwdXQoc2NvcGUsIFwiQ29kZVJlcG9zaXRvcnlHUkNVcmxcIiwge1xuICAgICAgZXhwb3J0TmFtZTogXCJDb2RlUmVwb3NpdG9yeUdSQ1VybFwiLFxuICAgICAgdmFsdWU6IHRoaXMuY29kZVJlcG9zaXRvcnkucmVwb3NpdG9yeUNsb25lVXJsR3JjLFxuICAgIH0pO1xuICB9XG5cbiAgYnVpbGRQaXBlbGluZSgpIHtcbiAgICBzdXBlci5idWlsZFBpcGVsaW5lKCk7XG5cbiAgICB0aGlzLnNvbmFyQ29kZVNjYW5uZXJDb25maWcgJiZcbiAgICAgIG5ldyBTb25hckNvZGVTY2FubmVyKHRoaXMsIFwiU29uYXJDb2RlU2Nhbm5lclwiLCB7XG4gICAgICAgIGFydGlmYWN0QnVja2V0QXJuOiB0aGlzLnBpcGVsaW5lLmFydGlmYWN0QnVja2V0LmJ1Y2tldEFybixcbiAgICAgICAgYXJ0aWZhY3RCdWNrZXRLZXlBcm46XG4gICAgICAgICAgdGhpcy5waXBlbGluZS5hcnRpZmFjdEJ1Y2tldC5lbmNyeXB0aW9uS2V5Py5rZXlBcm4sXG4gICAgICAgIHN5bnRoQnVpbGRBcm46IHRoaXMuc3ludGhQcm9qZWN0LnByb2plY3RBcm4sXG4gICAgICAgIC4uLnRoaXMuc29uYXJDb2RlU2Nhbm5lckNvbmZpZyxcbiAgICAgIH0pO1xuICB9XG59XG4iXX0=