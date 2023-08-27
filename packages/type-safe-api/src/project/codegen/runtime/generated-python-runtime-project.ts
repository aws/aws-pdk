/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PythonProject } from "projen/lib/python";
import { Language } from "../../languages";
import {
  CodeGenerationSourceOptions,
  GeneratedPythonRuntimeOptions,
} from "../../types";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../components/utils";

/**
 * Configuration for the generated python types project
 */
export interface GeneratedPythonTypesProjectOptions
  extends GeneratedPythonRuntimeOptions,
    CodeGenerationSourceOptions {}

/**
 * Python project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedPythonRuntimeProject extends PythonProject {
  /**
   * Patterns that are excluded from code generation
   */
  public static openApiIgnorePatterns: string[] = [
    "test",
    "test/*",
    "test/**/*",
    ".github",
    ".github/*",
    ".github/**/*",
    ".gitlab-ci.yml",
    ".travis.yml",
    "git_push.sh",
    "tox.ini",
    "requirements.txt",
    "test-requirements.txt",
    "setup.py",
    "setup.cfg",
  ];

  /**
   * Options configured for the project
   * @private
   */
  private readonly options: GeneratedPythonTypesProjectOptions;

  constructor(options: GeneratedPythonTypesProjectOptions) {
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
    this.options = options;

    // Add dependencies required by the client
    [
      "python-dateutil@~2.8.2",
      "pydantic@^1.10.5",
      "aenum@^3.1.11",
      "urllib3@~1.26.7",
      `aws-lambda-powertools@{extras=["all"],version="^2.23.0"}`,
      "python@^3.9",
    ].forEach((dep) => this.addDependency(dep));

    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    openapiGeneratorIgnore.addPatterns(
      ...GeneratedPythonRuntimeProject.openApiIgnorePatterns
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig({
      version: "6.6.0",
      ...options.openApiGeneratorCliConfig,
    });

    const generateTask = this.addTask("generate");
    generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    this.preCompileTask.spawn(generateTask);

    // Ignore all the generated code
    this.gitignore.addPatterns(
      this.moduleName,
      "docs",
      "README.md",
      ".openapi-generator"
    );

    // The poetry install that runs as part of post synthesis expects there to be some code present, but code isn't
    // generated until build time. This means that the first install will fail when either generating the project for
    // the first time or checking out a fresh copy (since generated code is not checked in to version control). We
    // therefore add a blank __init__.py as our first install step to keep poetry happy until the generator overwrites
    // it.
    this.tasks
      .tryFind("install")
      ?.prependExec(
        `mkdir -p ${this.moduleName} && touch ${this.moduleName}/__init__.py`
      );
  }

  public buildGenerateCommandArgs = () => {
    return buildInvokeOpenApiGeneratorCommandArgs({
      generator: "python-nextgen",
      specPath: this.options.specPath,
      smithyJsonPath: this.options.smithyJsonModelPath,
      generatorDirectory: Language.PYTHON,
      additionalProperties: {
        packageName: this.moduleName,
        projectName: this.name,
      },
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
    });
  };
}
