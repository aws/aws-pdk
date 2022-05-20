import { Construct } from "constructs";
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
export declare class SonarCodeScanner extends Construct {
    constructor(scope: Construct, id: string, props: SonarCodeScannerProps);
}
//# sourceMappingURL=sonar-code-scanner.d.ts.map