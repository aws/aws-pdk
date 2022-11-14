/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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

    this.addDevDependency("pytest");

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
