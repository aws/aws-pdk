/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Component, Project } from "projen";
import { GenerateTask } from "../codegen/components/generate-task";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../codegen/components/utils";

/**
 * Output for the OpenAPI parse/bundle task
 */
export interface TypeSafeApiModelBuildOutputOptions {
  /**
   * Path of the parsed/bundled OpenAPI specification (relative to the project root)
   */
  readonly parsedSpecFile: string;
}

/**
 * Options for configuring the OpenAPI parse/bundle task
 */
export interface TypeSafeApiModelBuildOptions
  extends TypeSafeApiModelBuildOutputOptions {
  /**
   * Path to the OpenAPI specification
   */
  readonly openApiSpecificationPath: string;
  /**
   * Optional path to the Smithy JSON model (for Smithy projects only)
   */
  readonly smithyJsonModelPath?: string;
}

/**
 * Adds the build task for parsing/bundling an OpenAPI spec ready for use by code generation projects
 */
export class TypeSafeApiModelBuild extends Component {
  constructor(project: Project, options: TypeSafeApiModelBuildOptions) {
    super(project);

    const { openApiSpecificationPath, smithyJsonModelPath, parsedSpecFile } =
      options;

    const generateTask = GenerateTask.ensure(project);

    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.PARSE_OPENAPI_SPEC,
        `--specPath ${openApiSpecificationPath} --outputPath ${parsedSpecFile}${
          smithyJsonModelPath ? ` --smithyJsonPath ${smithyJsonModelPath}` : ""
        }`
      )
    );

    project.compileTask.spawn(generateTask);

    project.addGitIgnore(parsedSpecFile);
  }
}
