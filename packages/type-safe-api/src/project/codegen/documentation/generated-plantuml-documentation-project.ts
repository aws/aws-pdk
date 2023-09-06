/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions, Task } from "projen";
import { DocumentationFormat } from "../../languages";
import { GeneratedPlantumlDocumentationOptions } from "../../types";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  OtherGenerators,
  TypeSafeApiScript,
} from "../components/utils";

export interface GeneratedPlantumlDocumentationProjectOptions
  extends ProjectOptions,
    GeneratedPlantumlDocumentationOptions {
  /**
   * Path to the OpenAPI Specification for which to generate docs, relative to the project outdir
   */
  readonly specPath: string;
}

export class GeneratedPlantumlDocumentationProject extends Project {
  private readonly generateTask: Task;

  constructor(options: GeneratedPlantumlDocumentationProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    this.generateTask = this.addTask("generate");
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        buildInvokeOpenApiGeneratorCommandArgs({
          generator: DocumentationFormat.PLANTUML,
          specPath: options.specPath,
          generatorDirectory: OtherGenerators.DOCS,
        })
      )
    );

    this.compileTask.spawn(this.generateTask);

    this.gitignore.addPatterns(".openapi-generator", "schemas.plantuml");
  }
}
