/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType } from "projen";
import { PythonProject } from "projen/lib/python";
import {
  CodeGenerationSourceOptions,
  GeneratedPythonInfrastructureOptions,
} from "../../../types";
import { OpenApiGeneratorIgnoreFile } from "../../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeMockDataGeneratorCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  OtherGenerators,
  TypeSafeApiScript,
} from "../../components/utils";
import { GeneratedPythonRuntimeProject } from "../../runtime/generated-python-runtime-project";

export interface GeneratedPythonCdkInfrastructureProjectOptions
  extends GeneratedPythonInfrastructureOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated python types
   */
  readonly generatedPythonTypes: GeneratedPythonRuntimeProject;
}

export class GeneratedPythonCdkInfrastructureProject extends PythonProject {
  /**
   * Options configured for the project
   * @private
   */
  private readonly options: GeneratedPythonCdkInfrastructureProjectOptions;

  constructor(options: GeneratedPythonCdkInfrastructureProjectOptions) {
    super({
      sample: false,
      pytest: false,
      poetry: true,
      poetryOptions: {
        packages: [{ include: options.moduleName }],
        // Module must be explicitly added to include since poetry excludes everything in .gitignore by default
        include: [options.moduleName, `${options.moduleName}/**/*.py`],
      },
      ...options,
    });
    this.options = options;

    [
      "aws_prototyping_sdk.type_safe_api@^0",
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
    openapiGeneratorIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      `!${this.moduleName}/__init__.py`,
      `!${this.moduleName}/api.py`,
      `!${this.moduleName}/mock_integrations.py`
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    const generateTask = this.addTask("generate");
    generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );
    if (!this.options.mockDataOptions?.disable) {
      generateTask.exec(this.buildGenerateMockDataCommand());
    }

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns(this.moduleName, ".openapi-generator", "mocks");

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
      generator: "python",
      specPath: this.options.specPath,
      smithyJsonPath: this.options.smithyJsonModelPath,
      generatorDirectory: OtherGenerators.PYTHON_CDK_INFRASTRUCTURE,
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-module-name": this.options.generatedPythonTypes.moduleName,
        // Spec path relative to the source directory
        "x-relative-spec-path": path.join("..", this.options.specPath),
        // Enable mock integration generation by default
        "x-enable-mock-integrations": !this.options.mockDataOptions?.disable,
      },
    });
  };

  public buildGenerateMockDataCommand = () => {
    return buildInvokeMockDataGeneratorCommand({
      specPath: this.options.specPath,
      ...this.options.mockDataOptions,
    });
  };
}
