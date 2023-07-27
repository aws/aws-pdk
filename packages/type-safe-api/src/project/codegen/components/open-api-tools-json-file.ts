/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjectUtils } from "@aws-prototyping-sdk/nx-monorepo";
import { JsonFile, Project } from "projen";
import { OpenApiGeneratorCliConfig } from "../../types";

/**
 * Represents an openapitools.json file
 * @see https://github.com/OpenAPITools/openapi-generator-cli#configuration
 */
export class OpenApiToolsJsonFile extends JsonFile {
  /**
   * Retrieves an instance of OpenApiToolsJsonFile if one is associated to the given project.
   *
   * @param project project instance.
   */
  static of(project: Project): OpenApiToolsJsonFile | undefined {
    return project.components.find((c) =>
      ProjectUtils.isNamedInstanceOf(c, OpenApiToolsJsonFile)
    ) as OpenApiToolsJsonFile | undefined;
  }

  /**
   * Retrieves an instance of OpenApiToolsJsonFile if one is associated to the given project,
   * otherwise creates a OpenApiToolsJsonFile instance for the project.
   *
   * @param project project instance.
   */
  static ensure(project: Project): OpenApiToolsJsonFile {
    return (
      OpenApiToolsJsonFile.of(project) || new OpenApiToolsJsonFile(project)
    );
  }

  /**
   * Configuration for OpenAPI Generator CLI
   * @private
   */
  private config: OpenApiGeneratorCliConfig = {
    version: "6.3.0",
    storageDir: "~/.open-api-generator-cli",
  };

  constructor(project: Project) {
    if (OpenApiToolsJsonFile.of(project)) {
      throw new Error(
        `Project ${project.name} already has associated OpenApiToolsJsonFile component.`
      );
    }

    super(project, "openapitools.json", {
      obj: {
        // Schema is located in node_modules when generator cli is installed in tmp dir
        $schema:
          "node_modules/@openapitools/openapi-generator-cli/config.schema.json",
        spaces: 2,
        "generator-cli": () => this.config,
      },
    });
  }

  /**
   * Update the OpenAPI Generator config. Shallow-merges with any existing default config
   */
  public addOpenApiGeneratorCliConfig(config?: OpenApiGeneratorCliConfig) {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
