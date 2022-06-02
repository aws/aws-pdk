// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import { Project, ProjectOptions, SampleFile } from "projen";
import { ParsedSpec } from "./components/parsed-spec";

/**
 * Project containing the OpenAPI spec, and a parsed spec for use by the CDK construct
 */
export class OpenApiSpec extends Project {
  public readonly specPath: string;
  public readonly specFileName: string = "spec.yaml";
  public readonly parsedSpecFileName: string = "parsed-spec.json";

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

    // Parser will run on synthesis to produce the parsed spec.
    new ParsedSpec(this, {
      specPath: this.specPath,
      outputPath: path.resolve(this.outdir, this.parsedSpecFileName),
    });
  }
}
