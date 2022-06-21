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
import { PythonProject, PythonProjectOptions } from "projen/lib/python";
import { GeneratedPythonClientSourceCode } from "./components/generated-python-client-source-code";

/**
 * Configuration for the generated python client project
 */
export interface GeneratedPythonClientProjectOptions
  extends PythonProjectOptions {
  /**
   * The absolute path to the OpenAPI specification (spec.yaml) from which to generate code
   */
  readonly specPath: string;

  /**
   * Whether or not the root api project has a parent (ie we are in a monorepo)
   */
  readonly rootProjectHasParent?: boolean;
}

/**
 * Python project containing a python client (and lambda handler wrappers) generated using OpenAPI Generator CLI
 */
export class GeneratedPythonClientProject extends PythonProject {
  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: GeneratedPythonClientProjectOptions) {
    super({
      sample: false,
      pytest: false,
      ...options,
    });

    new GeneratedPythonClientSourceCode(this, {
      specPath: options.specPath,
    });

    // When in a monorepo, with pip and venv (default), it's useful to install our package into the shared venv to make
    // it easier for other packages in the monorepo to take dependencies on this package.
    if (
      options.rootProjectHasParent &&
      (options.venv ?? true) &&
      (options.pip ?? true)
    ) {
      this.depsManager.installTask.exec("pip install --editable .");
    }
  }

  /**
   * @inheritDoc
   */
  synth() {
    // Save some time by only synthesizing once. We synthesize this project early so that it's available for the parent
    // project's install phase (pre-synth). Projen will call this method again at the usual time to synthesize this,
    // project, at which point we're already done so can skip.
    if (this.synthed) {
      return;
    }
    super.synth();
    this.synthed = true;
  }
}
