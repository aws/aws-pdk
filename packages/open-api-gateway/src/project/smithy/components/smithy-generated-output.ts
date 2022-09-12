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
import { Component, Project } from "projen";
import { exec } from "projen/lib/util";

/**
 * Configuration for the SmithyGeneratedOpenApiSpec component
 */
export interface SmithyGeneratedOpenApiSpecOptions {
  /**
   * Absolute path to the Smithy model directory
   */
  readonly modelPath: string;

  /**
   * Absolute path to the smithy-build.json file
   */
  readonly smithyBuildConfigPath: string;

  /**
   * Absolute to smithy build output
   */
  readonly outputPath: string;

  /**
   * Absolute path to the gradle project with the "generate" task
   */
  readonly gradleProjectPath: string;

  /**
   * Custom gradle wrapper path
   */
  readonly gradleWrapperPath?: string;
}

/**
 * Component for parsing the yaml OpenAPI spec as a single json object, resolving references etc.
 */
export class SmithyGeneratedOutput extends Component {
  private options: SmithyGeneratedOpenApiSpecOptions;

  constructor(project: Project, options: SmithyGeneratedOpenApiSpecOptions) {
    super(project);
    this.options = options;
  }

  synthesize() {
    super.synthesize();

    const {
      smithyBuildConfigPath,
      modelPath,
      outputPath,
      gradleProjectPath,
      gradleWrapperPath,
    } = this.options;

    // Run smithy generation
    exec(
      `./gradlew -p ${gradleProjectPath} generate -Pconfig=${smithyBuildConfigPath} -Pdiscover=${modelPath} -Poutput=${outputPath}`,
      {
        cwd:
          gradleWrapperPath ??
          path.resolve(__dirname, "..", "..", "..", "..", "scripts", "smithy"),
      }
    );
  }
}
