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

    this.addDependency("software.aws.awsprototypingsdk/aws-prototyping-sdk@^0");

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
