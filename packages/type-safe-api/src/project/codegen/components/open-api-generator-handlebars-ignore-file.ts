/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { IgnoreFile, Project } from "projen";
import { OpenApiGeneratorIgnoreFile } from "./open-api-generator-ignore-file";

/**
 * Represents an .openapi-generator-ignore-handlebars file.
 * This is used for an optional second code generation pass to generate files using the handlebars templating engine
 * @see https://github.com/OpenAPITools/openapi-generator/blob/master/docs/customization.md#ignore-file-format
 */
export class OpenApiGeneratorHandlebarsIgnoreFile extends IgnoreFile {
  constructor(project: Project) {
    super(project, ".openapi-generator-ignore-handlebars");

    // Ignore all files by default to allow opting in to generate with specific handlebars templates
    this.addPatterns(...OpenApiGeneratorIgnoreFile.ALL_FILES_PATTERNS);
  }
}
