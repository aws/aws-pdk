/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ok as assert } from "node:assert";
import { posix as path } from "path";
import { ProjectUtils } from "@aws/monorepo";
import { JsonFile, Project, Task } from "projen";
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

  public readonly createTask: Task;

  constructor(project: Project) {
    if (OpenApiToolsJsonFile.of(project)) {
      throw new Error(
        `Project ${project.name} already has associated OpenApiToolsJsonFile component.`
      );
    }

    const localFilePath = "openapitools.json";
    const dynamicFilePath = path.join(".pdk/dynamic-files", localFilePath);
    super(project, dynamicFilePath, {
      obj: {
        // Schema is located in node_modules when generator cli is installed in tmp dir
        $schema:
          "node_modules/@openapitools/openapi-generator-cli/config.schema.json",
        spaces: 2,
        "generator-cli": () => this.config,
      },
    });

    // Ignore the location that gets copied to
    project.addGitIgnore(`/${localFilePath}`);

    // Create the task, but don't attach it anywhere yet. This is because of wanting
    // to do the generation as part of the "generate" tasks, which may not yet exist.
    this.createTask = project.addTask(`create-openapitools.json`, {
      steps: [{ exec: `cp -f ${dynamicFilePath} ${localFilePath}` }],
    });
  }

  preSynthesize(): void {
    const generateTask = this.project.tasks.tryFind("generate");
    assert(generateTask);
    generateTask.prependSpawn(this.createTask);
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
