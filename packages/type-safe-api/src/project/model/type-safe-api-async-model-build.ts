/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Component, Project } from "projen";
import { TypeSafeApiModelBuildOutputOptions } from "./type-safe-api-model-build";
import { GenerateTask } from "../codegen/components/generate-task";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../codegen/components/utils";

/**
 * Output of the OpenAPI to AsyncAPI task
 */
export interface TypeSafeApiAsyncModelBuildOutputOptions {
  /**
   * Path to the generated AsyncAPI specification (relative to the project root)
   */
  readonly asyncApiSpecFile: string;
}

/**
 * Options for converting OpenAPI to AsyncAPI
 */
export interface TypeSafeApiAsyncModelBuildOptions
  extends TypeSafeApiAsyncModelBuildOutputOptions,
    TypeSafeApiModelBuildOutputOptions {}

/**
 * Adds a task to convert the OpenAPI specification into an AsyncAPI specification,
 * which can be used for documentation generation.
 */
export class TypeSafeApiAsyncModelBuild extends Component {
  constructor(project: Project, options: TypeSafeApiAsyncModelBuildOptions) {
    super(project);

    const { parsedSpecFile, asyncApiSpecFile } = options;

    const generateTask = GenerateTask.ensure(project);

    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE_ASYNCAPI_SPEC,
        `--specPath ${parsedSpecFile} --outputPath ${asyncApiSpecFile}`
      )
    );

    project.addGitIgnore(asyncApiSpecFile);
  }
}
