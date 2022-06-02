// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import * as fs from "fs-extra";
import { Component, Project } from "projen";
import { exec } from "projen/lib/util";

/**
 * Configuration for the GeneratedTypescriptClient component
 */
export interface GeneratedTypescriptClientOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;
}

/**
 * Generates the typescript client using OpenAPI Generator
 */
export class GeneratedTypescriptClient extends Component {
  private options: GeneratedTypescriptClientOptions;

  constructor(project: Project, options: GeneratedTypescriptClientOptions) {
    super(project);
    this.options = options;
  }

  synthesize() {
    super.synthesize();

    // Generate the typescript client
    exec(
      `./generate --spec-path ${this.options.specPath} --output-path ${this.project.outdir} --package-name ${this.project.name}`,
      {
        cwd: path.resolve(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "scripts",
          "generators",
          "typescript"
        ),
      }
    );

    // Write an index.ts which exposes the additional generated file OperationConfig.ts, which contains handler wrappers
    // and other generated code used by the construct.
    fs.writeFileSync(
      path.join(this.project.outdir, "src", "index.ts"),
      [
        "/* tslint:disable */",
        "/* eslint-disable */",
        "export * from './runtime';",
        "export * from './apis';",
        "export * from './models';",
        "export * from './apis/DefaultApi/OperationConfig';",
      ].join("\n")
    );
  }
}
