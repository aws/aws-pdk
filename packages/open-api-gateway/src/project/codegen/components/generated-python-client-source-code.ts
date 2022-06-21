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

import { Component } from "projen";
import { PythonProject } from "projen/lib/python";
import { ClientLanguage } from "../../languages";
import { generateClientCode } from "./utils";

/**
 * Configuration for the GeneratedPythonClient component
 */
export interface GeneratedPythonClientSourceCodeOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;
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

  synthesize() {
    super.synthesize();

    // Generate the python client
    generateClientCode({
      specPath: this.options.specPath,
      outputPath: this.project.outdir,
      packageName: (this.project as PythonProject).moduleName,
      language: ClientLanguage.PYTHON,
    });
  }
}
