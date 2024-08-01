/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, Task } from "projen";
import { PythonProject, PythonProjectOptions } from "projen/lib/python";
import {
  CodeGenerationSourceOptions,
  GeneratedWithOpenApiGeneratorOptions,
} from "../../../types";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../../components/open-api-generator-handlebars-ignore-file";
import { OpenApiGeneratorIgnoreFile } from "../../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../../components/open-api-tools-json-file";
import { TypeSafeApiCommandEnvironment } from "../../components/type-safe-api-command-environment";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  GenerationOptions,
  TypeSafeApiScript,
} from "../../components/utils";
import { GeneratedHandlersProjects } from "../../generate";
import { GeneratedPythonRuntimeBaseProject } from "../../runtime/generated-python-runtime-base-project";

export interface GeneratedPythonInfrastructureBaseOptions
  extends PythonProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

export interface GeneratedPythonCdkInfrastructureBaseProjectOptions
  extends GeneratedPythonInfrastructureBaseOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated python types
   */
  readonly generatedPythonTypes: GeneratedPythonRuntimeBaseProject;
  /**
   * Generated handlers projects
   */
  readonly generatedHandlers: GeneratedHandlersProjects;
}

export abstract class GeneratedPythonCdkInfrastructureBaseProject extends PythonProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedPythonCdkInfrastructureBaseProjectOptions;

  protected readonly generateTask: Task;
  protected readonly openapiGeneratorIgnore: OpenApiGeneratorIgnoreFile;

  constructor(options: GeneratedPythonCdkInfrastructureBaseProjectOptions) {
    super({
      ...options,
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

    [
      "aws_pdk@^0",
      "constructs@^10",
      "aws-cdk-lib@^2",
      "cdk-nag@^2",
      "python@^3.9",
      `${options.generatedPythonTypes.name}@{path="${path.relative(
        this.outdir,
        options.generatedPythonTypes.outdir
      )}", develop=true}`,
    ]
      .filter((dep) => !this.deps.tryGetDependency(dep, DependencyType.RUNTIME))
      .forEach((dep) => this.addDependency(dep));

    // Ignore everything but the target files
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    this.openapiGeneratorIgnore = openapiGeneratorIgnore;
    openapiGeneratorIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      `!${this.moduleName}/__init__.py`,
      `!${this.moduleName}/api.py`
    );

    const openapiGeneratorHandlebarsIgnore =
      new OpenApiGeneratorHandlebarsIgnoreFile(this);
    openapiGeneratorHandlebarsIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      `!${this.moduleName}/__functions.py`
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig({
      version: "6.6.0",
      ...options.openApiGeneratorCliConfig,
    });

    const generateTask = this.addTask("generate");
    this.generateTask = generateTask;
    generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns(this.moduleName, ".openapi-generator", "mocks");

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
    return buildInvokeOpenApiGeneratorCommandArgs(
      this.buildOpenApiGeneratorOptions()
    );
  };

  protected abstract buildOpenApiGeneratorOptions(): GenerationOptions;
}
