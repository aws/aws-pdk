/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { getLogger } from "log4js";
import { Component } from "projen";
import { PythonProject } from "projen/lib/python";
import { ClientLanguage } from "../../languages";
import { invokeOpenApiGenerator } from "./utils";

const logger = getLogger();

/**
 * Configuration for the GeneratedPythonClient component
 */
export interface GeneratedPythonClientSourceCodeOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;

  /**
   * Control if generator needs to be invoked
   */
  readonly invokeGenerator: boolean;
}

/**
 * Generates the python client using OpenAPI Generator
 */
export class GeneratedPythonClientSourceCode extends Component {
  private options: GeneratedPythonClientSourceCodeOptions;

  constructor(
    project: PythonProject,
    options: GeneratedPythonClientSourceCodeOptions
  ) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    if (this.options.invokeGenerator) {
      // Generate the python client
      logger.debug("Generating python client...");
      invokeOpenApiGenerator({
        generator: "python-experimental",
        specPath: this.options.specPath,
        outputPath: this.project.outdir,
        generatorDirectory: ClientLanguage.PYTHON,
        additionalProperties: {
          packageName: (this.project as PythonProject).moduleName,
          projectName: this.project.name,
        },
      });
    }
  }
}
