/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { writeFileSync } from "fs-extra";
import { getLogger } from "log4js";
import { Component } from "projen";
import { TypeScriptProject } from "projen/lib/typescript";
import { ClientLanguage } from "../../languages";
import { invokeOpenApiGenerator } from "./utils";

const logger = getLogger();

/**
 * Configuration for the GeneratedTypescriptClient component
 */
export interface GeneratedTypescriptClientSourceCodeOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;

  /**
   * Control if generator needs to be invoked
   */
  readonly invokeGenerator: boolean;
}

/**
 * Generates the typescript client using OpenAPI Generator
 */
export class GeneratedTypescriptClientSourceCode extends Component {
  private options: GeneratedTypescriptClientSourceCodeOptions;

  constructor(
    project: TypeScriptProject,
    options: GeneratedTypescriptClientSourceCodeOptions
  ) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    if (this.options.invokeGenerator) {
      // Generate the typescript client
      logger.debug("Generating typescript client...");
      invokeOpenApiGenerator({
        generator: "typescript-fetch",
        specPath: this.options.specPath,
        outputPath: this.project.outdir,
        generatorDirectory: ClientLanguage.TYPESCRIPT,
        additionalProperties: {
          npmName: (this.project as TypeScriptProject).package.packageName,
          typescriptThreePlus: "true",
          useSingleParameter: "true",
          supportsES6: "true",
        },
      });

      // Write an index.ts which exposes the additional generated file OperationConfig.ts, which contains handler wrappers
      // and other generated code used by the construct.
      writeFileSync(
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
}
