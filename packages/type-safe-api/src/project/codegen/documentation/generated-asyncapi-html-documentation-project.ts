/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions, Task } from "projen";
import { GeneratedAsyncApiHtmlDocumentationOptions } from "../../types";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../components/utils";

export interface GeneratedAsyncApiHtmlDocumentationProjectOptions
  extends ProjectOptions,
    GeneratedAsyncApiHtmlDocumentationOptions {
  /**
   * Path to the AsyncAPI Specification for which to generate docs, relative to the project outdir
   */
  readonly specPath: string;
}

export class GeneratedAsyncApiHtmlDocumentationProject extends Project {
  private readonly generateTask: Task;

  constructor(options: GeneratedAsyncApiHtmlDocumentationProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.generateTask = this.addTask("generate");
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE_ASYNCAPI_HTML_DOCS,
        `--spec-path ${options.specPath} --output-path .`
      )
    );
    this.compileTask.spawn(this.generateTask);

    if (!options.commitGeneratedCode) {
      this.gitignore.addPatterns("index.html");
    }
  }
}
