/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import type { OpenAPIV3 } from "openapi-types";
import { Component, Project } from "projen";
import { exec, tryReadFileSync } from "projen/lib/util";

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
  static parse(specPath: string, outputPath: string) {
    // Parse the spec and write to the target output path
    exec(
      `./parse-openapi-spec --specPath=${specPath} --outputPath=${outputPath}`,
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

  private options: ParsedSpecOptions;

  constructor(project: Project, options: ParsedSpecOptions) {
    super(project);
    this.options = options;
  }

  synthesize() {
    super.synthesize();

    ParsedSpec.parse(this.options.specPath, this.options.outputPath);

    const singleSpecFile = tryReadFileSync(this.options.outputPath);
    if (!singleSpecFile) {
      throw new Error(
        `Failed to parse specification at ${this.options.specPath}`
      );
    }

    const parsedSpec: OpenAPIV3.Document = JSON.parse(singleSpecFile);

    // TODO: Remove this validation and update mustache templates as appropriate when the following has been addressed:
    // https://github.com/OpenAPITools/openapi-generator/pull/14568
    // Check that each operation has zero or one tags
    const operationsWithMultipleTags = Object.entries(parsedSpec.paths).flatMap(
      ([urlPath, methods]) =>
        Object.entries(methods ?? {})
          .filter(
            ([, operation]) =>
              typeof operation === "object" &&
              "tags" in operation &&
              operation.tags &&
              operation.tags.length > 1
          )
          .map(([httpMethod]) => `${httpMethod} ${urlPath}`)
    );

    if (operationsWithMultipleTags.length > 0) {
      throw new Error(
        `Operations with multiple tags are not yet supported, please tag operations with at most one tag. The following operations have multiple tags: ${operationsWithMultipleTags.join(
          ", "
        )}`
      );
    }
  }
}
