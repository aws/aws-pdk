// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
export class PdkPipelinePyProject extends AwsCdkPythonApp {
  constructor(options: PDKPipelinePyProjectOptions) {
    super({
      github: false,
      sample: false,
      pytest: false,
      ...options,
    });

    new SampleDir(this, this.moduleName, {
      sourceDir: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "sample",
        "pdk_pipeline_py",
        "src"
      ),
    });

    this.pytest = new Pytest(this, options.pytestOptions);

    new SampleDir(this, this.testdir, {
      sourceDir: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "sample",
        "pdk_pipeline_py",
        "tests"
      ),
    });
  }
}
