/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, Project } from "projen";
import { invokeOpenApiGenerator, NonClientGeneratorDirectory } from "../utils";

/**
 * Configuration for the GeneratedMarkdownDocs component
 */
export interface GeneratedMarkdownDocsOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;
}

/**
 * Generates the markdown documentation using OpenAPI Generator
 */
export class GeneratedMarkdownDocs extends Component {
  private options: GeneratedMarkdownDocsOptions;

  constructor(project: Project, options: GeneratedMarkdownDocsOptions) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    // Generate the markdown docs
    invokeOpenApiGenerator({
      generator: "markdown",
      specPath: this.options.specPath,
      outputPath: path.join(this.project.outdir, "markdown"),
      generatorDirectory: NonClientGeneratorDirectory.DOCS,
    });
  }
}
