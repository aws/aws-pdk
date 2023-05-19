/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, ProjectOptions, Task } from "projen";
import { GeneratedHtmlRedocDocumentationOptions } from "../../types";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import { buildInvokeCustomDocsGeneratorCommand } from "../components/utils";

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

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    this.generateTask = this.addTask("generate");

    const cmd = buildInvokeCustomDocsGeneratorCommand({
      generator: "html-redoc",
      specPath: options.specPath,
      outputPath: this.outdir,
    });
    this.generateTask.exec(cmd.command, {
      cwd: path.relative(this.outdir, cmd.workingDir),
    });

    this.compileTask.spawn(this.generateTask);

    this.gitignore.addPatterns("index.html");
  }
}
