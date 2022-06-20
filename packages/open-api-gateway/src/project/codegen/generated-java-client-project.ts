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
import { JavaProject, JavaProjectOptions } from "projen/lib/java";
import { GeneratedJavaClientSourceCode } from "./components/generated-java-client-source-code";

/**
 * Configuration for the generated java client project
 */
export interface GeneratedJavaClientProjectOptions extends JavaProjectOptions {
  /**
   * The absolute path to the OpenAPI specification (spec.yaml) from which to generate code
   */
  readonly specPath: string;
}

/**
 * Java project containing a java client (and lambda handler wrappers) generated using OpenAPI Generator CLI
 */
export class GeneratedJavaClientProject extends JavaProject {
  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: GeneratedJavaClientProjectOptions) {
    super({
      sample: false,
      junit: false,
      ...options,
    });

    new GeneratedJavaClientSourceCode(this, {
      specPath: options.specPath,
    });
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
