/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, Project } from "projen";
import { invokeCustomDocsGenerator } from "../utils";

/**
 * Configuration for the GeneratedHtmlRedocDocs component
 */
export interface GeneratedHtmlRedocDocsOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;
}

/**
 * Generates html documentation using Redoc
 */
export class GeneratedHtmlRedocDocs extends Component {
  private options: GeneratedHtmlRedocDocsOptions;

  constructor(project: Project, options: GeneratedHtmlRedocDocsOptions) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    invokeCustomDocsGenerator({
      generator: "html-redoc",
      args: `--spec-path ${this.options.specPath} --output-path ${path.join(
        this.project.outdir,
        "html_redoc",
        "index.html"
      )}`,
    });
  }
}
