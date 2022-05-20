import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from "projen/lib/awscdk";
/**
 * Configuration options for the PDKPipelineTsProject.
 */
export interface PDKPipelineTsProjectOptions extends AwsCdkTypeScriptAppOptions {
}
/**
 * Synthesizes a Typescript Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-ts
 */
export declare class PDKPipelineTsProject extends AwsCdkTypeScriptApp {
    constructor(options: PDKPipelineTsProjectOptions);
}
//# sourceMappingURL=pdk-pipeline-ts-project.d.ts.map