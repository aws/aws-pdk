// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import { SampleDir } from "projen";
import {
  AwsCdkTypeScriptApp,
  AwsCdkTypeScriptAppOptions,
} from "projen/lib/awscdk";

/**
 * Configuration options for the PDKPipelineTsProject.
 */
export interface PDKPipelineTsProjectOptions
  extends AwsCdkTypeScriptAppOptions {}

/**
 * Synthesizes a Typescript Project with a CI/CD pipeline.
 *
 * @pjid pdk-pipeline-ts
 */
export class PDKPipelineTsProject extends AwsCdkTypeScriptApp {
  constructor(options: PDKPipelineTsProjectOptions) {
    super({
      github: false,
      package: false,
      prettier: true,
      projenrcTs: true,
      release: false,
      sampleCode: false,
      ...options,
      appEntrypoint: options.appEntrypoint || "pipeline.ts",
      cdkVersion: options.cdkVersion || "2.0.0",
    });

    this.addDeps("aws-prototyping-sdk");

    new SampleDir(this, this.srcdir, {
      sourceDir: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "sample-pdk-pipeline-ts",
        "src"
      ),
    });

    new SampleDir(this, this.testdir, {
      sourceDir: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "sample-pdk-pipeline-ts",
        "test"
      ),
    });
  }
}
