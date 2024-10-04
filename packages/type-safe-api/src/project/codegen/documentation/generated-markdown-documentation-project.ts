/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions, Task } from "projen";
import { GeneratedMarkdownDocumentationOptions } from "../../types";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildCodegenCommandArgs,
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../components/utils";

export interface GeneratedMarkdownDocumentationProjectOptions
  extends ProjectOptions,
    GeneratedMarkdownDocumentationOptions {
  /**
   * Path to the OpenAPI Specification for which to generate docs, relative to the project outdir
   */
  readonly specPath: string;
}

export class GeneratedMarkdownDocumentationProject extends Project {
  private readonly generateTask: Task;

  constructor(options: GeneratedMarkdownDocumentationProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    this.generateTask = this.addTask("generate");
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE_NEXT,
        buildCodegenCommandArgs({
          specPath: options.specPath,
          templateDirs: ["docs/templates/markdown"],
        })
      )
    );

    this.compileTask.spawn(this.generateTask);

    if (!options.commitGeneratedCode) {
      this.gitignore.addPatterns(
        ".openapi-generator",
        "Apis",
        "Models",
        "README.md"
      );
    } else {
      this.gitignore.addPatterns(".openapi-generator");
    }
  }
}
