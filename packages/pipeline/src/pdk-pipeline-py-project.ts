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

import * as fs from "fs";
import * as path from "path";
import { SampleDir } from "projen";
import { AwsCdkPythonApp, AwsCdkPythonAppOptions } from "projen/lib/awscdk";
import { Pytest } from "projen/lib/python";

/**
 * Configuration options for the PDKPipelinePyProject.
 */
export interface PDKPipelinePyProjectOptions extends AwsCdkPythonAppOptions {}

/**
 * Synthesizes a Python Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-py
 */
export class PDKPipelinePyProject extends AwsCdkPythonApp {
  constructor(options: PDKPipelinePyProjectOptions) {
    super({
      github: false,
      sample: false,
      pytest: false,
      ...options,
      appEntrypoint:
        options.appEntrypoint || `${options.moduleName}/pipeline.py`,
    });

    ["aws_prototyping_sdk", "cdk-nag", "pyhumps"].forEach((dep) =>
      this.addDependency(dep)
    );

    new SampleDir(this, this.moduleName, {
      sourceDir: path.join(__dirname, "..", "samples", "python", "infra"),
    });

    this.pytest = new Pytest(this, options.pytestOptions);

    new SampleDir(this, this.testdir, {
      files: {
        "__init__.py": "",
        "test_pipeline.py": fs
          .readFileSync(
            path.join(
              __dirname,
              "..",
              "samples",
              "python",
              "tests",
              "test_pipeline.py"
            )
          )
          .toString()
          .replace("infra.", `${this.moduleName}.`),
      },
    });
  }
}
