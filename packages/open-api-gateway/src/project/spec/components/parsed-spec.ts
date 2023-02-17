/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { getLogger } from "log4js";
import type { OpenAPIV3 } from "openapi-types";
import { Component, Project } from "projen";
import { exec, tryReadFileSync } from "projen/lib/util";

const logger = getLogger();

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

    // To avoid duplicating custom generated code (eg. OperationConfig or handler wrappers) and causing build errors, we
    // will apply the OpenAPI Normalizer to KEEP_ONLY_FIRST_TAG_IN_OPERATION when generating code. Tags are still
    // preserved in the specification to allow for better documentation.
    // See: https://github.com/OpenAPITools/openapi-generator/pull/14465
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
      logger.warn(
        `The following operations had multiple tags: ${operationsWithMultipleTags.join(
          ", "
        )}. Code will only be generated for each operation's first tag.`
      );
    }
  }
}
