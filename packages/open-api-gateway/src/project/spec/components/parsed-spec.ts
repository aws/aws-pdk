// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import { Component, Project } from "projen";
import { exec } from "projen/lib/util";

/**
 * Configuration for the ParsedSpec component
 */
export interface ParsedSpecOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;
  /**
   * Absolute path to write the parsed spec json file to
   */
  readonly outputPath: string;
}

/**
 * Component for parsing the yaml OpenAPI spec as a single json object, resolving references etc.
 */
export class ParsedSpec extends Component {
  private options: ParsedSpecOptions;

  constructor(project: Project, options: ParsedSpecOptions) {
    super(project);
    this.options = options;
  }

  synthesize() {
    super.synthesize();

    // Parse the spec and write to the target output path
    exec(
      `./parse-openapi-spec --specPath=${this.options.specPath} --outputPath=${this.options.outputPath}`,
      {
        cwd: path.resolve(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "scripts",
          "parser"
        ),
      }
    );
  }
}
