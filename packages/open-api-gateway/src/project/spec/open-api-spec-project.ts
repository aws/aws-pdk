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
import { Project, SampleFile, ProjectOptions } from "projen";
import { ParsedSpec } from "./components/parsed-spec";

/**
 * Configuration for the OpenAPI spec project
 */
export interface OpenApiSpecProjectOptions extends ProjectOptions {
  /**
   * The name of the OpenAPI specification file.
   * @default "spec.yaml"
   */
  readonly specFileName?: string;
  /**
   * The name of the output parsed OpenAPI specification file. Must end with .json.
   * @default ".parsed-spec.json"
   */
  readonly parsedSpecFileName?: string;
}

/**
 * Project containing the OpenAPI spec, and a parsed spec for use by the CDK construct
 */
export class OpenApiSpecProject extends Project {
  public readonly specPath: string;
  public readonly parsedSpecPath: string;

  public readonly specFileName: string;
  public readonly parsedSpecFileName: string;

  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: OpenApiSpecProjectOptions) {
    super(options);
    // HACK: remove all components but the ones we are registering - removes .gitignore, tasks, etc since these are
    // unused and a distraction for end-users!
    // @ts-ignore
    this._components = [];

    this.specFileName = options.specFileName ?? "spec.yaml";
    this.parsedSpecFileName = options.parsedSpecFileName ?? ".parsed-spec.json";

    if (!this.parsedSpecFileName.endsWith(".json")) {
      throw new Error("Parsed spec file must end with .json");
    }

    this.specPath = path.join(this.outdir, this.specFileName);
    this.parsedSpecPath = path.join(this.outdir, this.parsedSpecFileName);

    // Create a sample OpenAPI spec yaml if not defined
    new SampleFile(this, this.specFileName, {
      sourcePath: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "spec.yaml"
      ),
    });

    // Parse the spec to produce a consolidated, bundled spec which can be read by cdk constructs or other tooling
    new ParsedSpec(this, {
      specPath: this.specPath,
      outputPath: this.parsedSpecPath,
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
