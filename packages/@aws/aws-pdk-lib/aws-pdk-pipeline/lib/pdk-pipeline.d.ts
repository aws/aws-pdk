import { RemovalPolicy } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { CodePipeline, CodePipelineProps, ShellStepProps } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { SonarCodeScannerConfig } from "./code_scanner/sonar-code-scanner";
export * from "./code_scanner/sonar-code-scanner";
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
}
/**
 * An extension to CodePipeline which configures sane defaults for a NX Monorepo
 * codebase. In addition to this, it also creates a CodeCommit repository with
 * automated PR builds and approvals.
 */
export declare class PDKPipeline extends CodePipeline {
    readonly codeRepository: Repository;
    private readonly sonarCodeScannerConfig?;
    constructor(scope: Construct, id: string, props: PDKPipelineProps);
    buildPipeline(): void;
}
//# sourceMappingURL=pdk-pipeline.d.ts.map