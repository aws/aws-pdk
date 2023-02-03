/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, Project } from "projen";
import { invokeOpenApiGenerator, NonClientGeneratorDirectory } from "../utils";

/**
 * Configuration for the GeneratedPlantUmlDocs component
 */
export interface GeneratedPlantUmlDocsOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;
}

/**
 * Generates the plantuml documentation using OpenAPI Generator
 */
export class GeneratedPlantUmlDocs extends Component {
  private options: GeneratedPlantUmlDocsOptions;

  constructor(project: Project, options: GeneratedPlantUmlDocsOptions) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    // Generate the plantuml docs
    invokeOpenApiGenerator({
      generator: "plantuml",
      specPath: this.options.specPath,
      outputPath: path.join(this.project.outdir, "plantuml"),
      generatorDirectory: NonClientGeneratorDirectory.DOCS,
    });
  }
}
