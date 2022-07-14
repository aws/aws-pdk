/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

import * as path from "path";
import { SampleDir } from "projen";
import {
  AwsCdkTypeScriptApp,
  AwsCdkTypeScriptAppOptions,
} from "projen/lib/awscdk";

/**
 * Configuration options for the PDKPipelineTsProject.
 */
export interface PDKPipelineTsProjectOptions
  extends AwsCdkTypeScriptAppOptions {}

/**
 * Synthesizes a Typescript Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-ts
 */
export class PDKPipelineTsProject extends AwsCdkTypeScriptApp {
  constructor(options: PDKPipelineTsProjectOptions) {
    super({
      github: false,
      package: false,
      prettier: true,
      projenrcTs: true,
      release: false,
      sampleCode: false,
      ...options,
      appEntrypoint: options.appEntrypoint || "pipeline.ts",
    });

    this.addDeps("aws-prototyping-sdk", "cdk-nag");

    new SampleDir(this, this.srcdir, {
      sourceDir: path.join(__dirname, "..", "samples", "typescript", "src"),
    });

    new SampleDir(this, this.testdir, {
      sourceDir: path.join(__dirname, "..", "samples", "typescript", "test"),
    });
  }
}
