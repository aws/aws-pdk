// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import { SampleDir } from "projen";
import { AwsCdkJavaApp, AwsCdkJavaAppOptions } from "projen/lib/awscdk";

/**
 * Configuration options for the PDKPipelineJavaProject.
 */
export interface PDKPipelineJavaProjectOptions extends AwsCdkJavaAppOptions {}

/**
 * Synthesizes a Java Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-java
 */
export class PDKPipelineJavaProject extends AwsCdkJavaApp {
  constructor(options: PDKPipelineJavaProjectOptions) {
    super({
      sample: false,
      junit: false,
      ...options,
    });

    this.testTask.exec("mvn test");
    this.addTestDependency("org.junit.jupiter/junit-jupiter-api@5.7.0");
    this.addTestDependency("org.junit.jupiter/junit-jupiter-engine@5.7.0");

    new SampleDir(this, "src", {
      sourceDir: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "sample-pdk-pipeline-java",
        "src"
      ),
    });
  }
}
