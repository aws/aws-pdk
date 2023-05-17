/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, ProjectOptions, Task } from "projen";
import { DocumentationFormat } from "../../languages";
import {
  buildInvokeOpenApiGeneratorCommand,
  OtherGenerators,
} from "../components/utils";

export interface GeneratedHtml2DocumentationProjectOptions
  extends ProjectOptions {
  /**
   * Path to the OpenAPI Specification for which to generate docs, relative to the project outdir
   */
  readonly specPath: string;
}

export class GeneratedHtml2DocumentationProject extends Project {
  private readonly generateTask: Task;

  constructor(options: GeneratedHtml2DocumentationProjectOptions) {
    super(options);

    this.generateTask = this.addTask("generate");

    const cmd = buildInvokeOpenApiGeneratorCommand({
      generator: DocumentationFormat.HTML2,
      specPath: options.specPath,
      outputPath: this.outdir,
      generatorDirectory: OtherGenerators.DOCS,
    });
    this.generateTask.exec(cmd.command, {
      cwd: path.relative(this.outdir, cmd.workingDir),
    });

    this.compileTask.spawn(this.generateTask);

    this.gitignore.addPatterns(".openapi-generator", "index.html");
  }
}
