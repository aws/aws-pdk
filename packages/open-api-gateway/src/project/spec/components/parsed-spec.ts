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
