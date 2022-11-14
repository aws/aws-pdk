/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
