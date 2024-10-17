/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions, Task } from "projen";
import { GeneratedAsyncApiMarkdownDocumentationOptions } from "../../types";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";

export interface GeneratedAsyncApiMarkdownDocumentationProjectOptions
  extends ProjectOptions,
    GeneratedAsyncApiMarkdownDocumentationOptions {
  /**
   * Path to the AsyncAPI Specification for which to generate docs, relative to the project outdir
   */
  readonly specPath: string;
}

export class GeneratedAsyncApiMarkdownDocumentationProject extends Project {
  private readonly generateTask: Task;

  constructor(options: GeneratedAsyncApiMarkdownDocumentationProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.generateTask = this.addTask("generate");
    this.generateTask.exec(
      `npx --yes @asyncapi/cli@1.7.3 generate fromTemplate "${options.specPath}" @asyncapi/markdown-template@1.5.0 --param outFilename=index.md --force-write`
    );
    this.compileTask.spawn(this.generateTask);

    if (!options.commitGeneratedCode) {
      this.gitignore.addPatterns("index.md");
    }
  }
}
