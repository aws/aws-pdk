/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
      mainClass:
        options.mainClass !== "org.acme.MyApp"
          ? options.mainClass
          : 'software.aws.Pipeline -Dexec.classpathScope="test"',
    });

    this.addDependency("software.aws.awsprototypingsdk/pipeline@^0");
    this.addDependency("software.aws.awsprototypingsdk/pdk-nag@^0");
    this.addDependency("io.github.cdklabs/cdknag@^2");

    this.testTask.exec("mvn test");
    this.addTestDependency("org.junit.jupiter/junit-jupiter-api@5.7.0");
    this.addTestDependency("org.junit.jupiter/junit-jupiter-engine@5.7.0");

    const mainPackage = this.mainClass
      .split(" ")[0]
      .split(".")
      .slice(0, -1)
      .join(".");
    new SampleDir(
      this,
      path.join("src", "main", "java", ...mainPackage.split(".")),
      {
        sourceDir: path.join(
          __dirname,
          "..",
          "samples",
          "pipeline",
          "java",
          "src",
          "main",
          "java",
          "software",
          "aws"
        ),
      }
    );
    new SampleDir(
      this,
      path.join("src", "test", "java", ...mainPackage.split(".")),
      {
        sourceDir: path.join(
          __dirname,
          "..",
          "samples",
          "pipeline",
          "java",
          "src",
          "test",
          "java",
          "software",
          "aws"
        ),
      }
    );
  }
}
