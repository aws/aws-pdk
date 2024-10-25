/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, SampleFile } from "projen";
import { ModelLanguage } from "../types";

/**
 * Options for the model readme
 */
export interface ModelReadmeOptions {
  /**
   * Language for the model
   */
  readonly modelLanguage: ModelLanguage;
  /**
   * Type of API
   */
  readonly apiType: "rest" | "async";
}

/**
 * README.md file for a model project
 */
export class ModelReadme extends SampleFile {
  constructor(project: Project, options: ModelReadmeOptions) {
    super(project, "README.md", {
      sourcePath: path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "type-safe-api",
        "readme",
        `model-${options.apiType}`,
        `${options.modelLanguage}.md`
      ),
    });
  }
}
