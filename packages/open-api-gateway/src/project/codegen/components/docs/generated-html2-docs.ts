/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, Project } from "projen";
import { invokeOpenApiGenerator, NonClientGeneratorDirectory } from "../utils";

/**
 * Configuration for the GeneratedHtml2Docs component
 */
export interface GeneratedHtml2DocsOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;
}

/**
 * Generates the html2 documentation using OpenAPI Generator
 */
export class GeneratedHtml2Docs extends Component {
  private options: GeneratedHtml2DocsOptions;

  constructor(project: Project, options: GeneratedHtml2DocsOptions) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    // Generate the html2 docs
    invokeOpenApiGenerator({
      generator: "html2",
      specPath: this.options.specPath,
      outputPath: path.join(this.project.outdir, "html2"),
      generatorDirectory: NonClientGeneratorDirectory.DOCS,
    });
  }
}
