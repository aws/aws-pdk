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
