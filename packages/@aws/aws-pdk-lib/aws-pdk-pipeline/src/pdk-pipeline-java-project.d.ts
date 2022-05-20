import { AwsCdkJavaApp, AwsCdkJavaAppOptions } from "projen/lib/awscdk";
/**
 * Configuration options for the PDKPipelineJavaProject.
 */
export interface PDKPipelineJavaProjectOptions extends AwsCdkJavaAppOptions {
}
/**
 * Synthesizes a Java Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-java
 */
export declare class PDKPipelineJavaProject extends AwsCdkJavaApp {
    constructor(options: PDKPipelineJavaProjectOptions);
}
//# sourceMappingURL=pdk-pipeline-java-project.d.ts.map