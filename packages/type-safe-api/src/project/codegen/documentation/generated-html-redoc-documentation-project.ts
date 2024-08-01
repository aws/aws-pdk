/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions, Task } from "projen";
import { GeneratedHtmlRedocDocumentationOptions } from "../../types";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../components/utils";

export interface GeneratedHtmlRedocDocumentationProjectOptions
  extends ProjectOptions,
    GeneratedHtmlRedocDocumentationOptions {
  /**
   * Path to the OpenAPI Specification for which to generate docs, relative to the project outdir
   */
  readonly specPath: string;
}

export class GeneratedHtmlRedocDocumentationProject extends Project {
  private readonly generateTask: Task;

  constructor(options: GeneratedHtmlRedocDocumentationProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    this.generateTask = this.addTask("generate");
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE_HTML_REDOC_DOCS,
        `--spec-path ${options.specPath} --output-path .`
      )
    );
    this.compileTask.spawn(this.generateTask);

    if (!options.commitGeneratedCode) {
      this.gitignore.addPatterns("index.html");
    }
  }
}
