/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PythonProject } from "projen/lib/python";
import {
  CodeGenerationSourceOptions,
  GeneratedPythonRuntimeOptions,
} from "../../types";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildCodegenCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  TypeSafeApiScript,
} from "../components/utils";

/**
 * Configuration for the generated python types project
 */
export interface GeneratedPythonRuntimeBaseProjectOptions
  extends GeneratedPythonRuntimeOptions,
    CodeGenerationSourceOptions {}

/**
 * Python project containing types generated using OpenAPI Generator CLI
 */
export abstract class GeneratedPythonRuntimeBaseProject extends PythonProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedPythonRuntimeBaseProjectOptions;

  constructor(options: GeneratedPythonRuntimeBaseProjectOptions) {
    super({
      ...(options as any),
      sample: false,
      pytest: false,
      poetry: true,
      poetryOptions: {
        packages: [{ include: options.moduleName }],
        // Module must be explicitly added to include since poetry excludes everything in .gitignore by default
        include: [options.moduleName, `${options.moduleName}/**/*.py`],
      },
    });
    TypeSafeApiCommandEnvironment.ensure(this);
    this.options = options;

    // Add dependencies required by the client
    [
      "python-dateutil@~2.8.2",
      "pydantic@^2.5.2",
      "aenum@^3.1.11",
      "urllib3@~1.26.7",
      `aws-lambda-powertools@{extras=["tracer", "aws-sdk"],version="^2.28.0"}`,
      "python@^3.9",
    ].forEach((dep) => this.addDependency(dep));

    const generateTask = this.addTask("generate");
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    this.preCompileTask.spawn(generateTask);

    if (!this.options.commitGeneratedCode) {
      // Ignore all the generated code
      this.gitignore.addPatterns(this.moduleName, "docs", "README.md");
    }
    this.gitignore.addPatterns(".openapi-generator", ".tsapi-manifest");

    // The poetry install that runs as part of post synthesis expects there to be some code present, but code isn't
    // generated until build time. This means that the first install will fail when either generating the project for
    // the first time or checking out a fresh copy (since generated code is not checked in to version control). We
    // therefore add a blank __init__.py and README.md as our first install step to keep poetry happy until the
    // generator overwrites it.
    ["install", "install:ci"].forEach((t) =>
      this.tasks
        .tryFind(t)
        ?.prependExec(
          `mkdir -p ${this.moduleName} && touch ${this.moduleName}/__init__.py README.md`
        )
    );
  }

  public buildGenerateCommandArgs = () => {
    return buildCodegenCommandArgs(this.buildCodegenOptions());
  };

  protected abstract buildCodegenOptions(): CodegenOptions;
}
