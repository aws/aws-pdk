/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { IgnoreFile, Project } from "projen";

/**
 * Represents an .openapi-generator-ignore file
 * @see https://github.com/OpenAPITools/openapi-generator/blob/master/docs/customization.md#ignore-file-format
 */
export class OpenApiGeneratorIgnoreFile extends IgnoreFile {
  constructor(project: Project) {
    super(project, ".openapi-generator-ignore");

    // We should always use the projen .gitignore since projen manages the build, and therefore the ignored build
    // artifacts
    this.addPatterns(".gitignore");
  }
}
