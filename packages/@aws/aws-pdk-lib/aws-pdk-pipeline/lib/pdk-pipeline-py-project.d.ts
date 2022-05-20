import { AwsCdkPythonApp, AwsCdkPythonAppOptions } from "projen/lib/awscdk";
/**
 * Configuration options for the PDKPipelinePyProject.
 */
export interface PDKPipelinePyProjectOptions extends AwsCdkPythonAppOptions {
}
/**
 * Synthesizes a Python Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-py
 */
export declare class PDKPipelinePyProject extends AwsCdkPythonApp {
    constructor(options: PDKPipelinePyProjectOptions);
}
//# sourceMappingURL=pdk-pipeline-py-project.d.ts.map