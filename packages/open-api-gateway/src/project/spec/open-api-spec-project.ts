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
import { Project, ProjectOptions, SampleFile } from "projen";
import { ParsedSpec } from "./components/parsed-spec";

/**
 * Project containing the OpenAPI spec, and a parsed spec for use by the CDK construct
 */
export class OpenApiSpecProject extends Project {
  public readonly specPath: string;
  public readonly parsedSpecPath: string;

  public readonly specFileName: string = "spec.yaml";
  public readonly parsedSpecFileName: string = "parsed-spec.json";

  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: ProjectOptions) {
    super(options);
    this.specPath = path.join(this.outdir, this.specFileName);

    // Create a sample OpenAPI spec yaml if not defined
    new SampleFile(this, this.specFileName, {
      sourcePath: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        this.specFileName
      ),
    });

    this.parsedSpecPath = path.resolve(this.outdir, this.parsedSpecFileName);

    // Parser will run on synthesis to produce the parsed spec.
    new ParsedSpec(this, {
      specPath: this.specPath,
      outputPath: this.parsedSpecPath,
    });
  }

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
