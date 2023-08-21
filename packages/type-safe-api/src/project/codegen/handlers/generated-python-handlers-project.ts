/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, SampleFile } from "projen";
import { PythonProject } from "projen/lib/python";
import {
  CodeGenerationSourceOptions,
  GeneratedPythonHandlersOptions,
} from "../../types";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../components/open-api-generator-handlebars-ignore-file";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  OtherGenerators,
  TypeSafeApiScript,
} from "../components/utils";
import { GeneratedPythonRuntimeProject } from "../runtime/generated-python-runtime-project";

export interface GeneratedPythonHandlersProjectOptions
  extends GeneratedPythonHandlersOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated python types
   */
  readonly generatedPythonTypes: GeneratedPythonRuntimeProject;
}

export class GeneratedPythonHandlersProject extends PythonProject {
  /**
   * Options configured for the project
   * @private
   */
  private readonly options: GeneratedPythonHandlersProjectOptions;

  constructor(options: GeneratedPythonHandlersProjectOptions) {
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
      "python@^3.9",
      `${options.generatedPythonTypes.name}@{path="${path.relative(
        this.outdir,
        options.generatedPythonTypes.outdir
      )}", develop=true}`,
    ]
      .filter((dep) => !this.deps.tryGetDependency(dep, DependencyType.RUNTIME))
      .forEach((dep) => this.addDependency(dep));

    // Ignore everything for the first mustache pass
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    openapiGeneratorIgnore.addPatterns("/*", "**/*", "*");
    // Ignore everything but the handler files for the handlebars pass
    const openapiGeneratorHandlebarsIgnore =
      new OpenApiGeneratorHandlebarsIgnoreFile(this);
    openapiGeneratorHandlebarsIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      // This will be split into a file per targeted handler
      `!${this.moduleName}/__all_handlers.py`
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

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns(".openapi-generator");

    // Write __init__.py as sample code
    new SampleFile(this, path.join(this.moduleName, "__init__.py"), {
      contents: "#",
    });

    // Package task to build a distributable which can be deployed to lambda
    this.packageTask.exec("mkdir -p dist/lambda && rm -rf dist/lambda/*");
    this.packageTask.exec(
      `cp -r ${this.moduleName} dist/lambda/${this.moduleName}`
    );
    this.packageTask.exec(
      "poetry export --without-hashes --format=requirements.txt > dist/lambda/requirements.txt"
    );
    this.packageTask.exec(
      "pip install -r dist/lambda/requirements.txt --target dist/lambda --upgrade"
    );
  }

  public buildGenerateCommandArgs = () => {
    return buildInvokeOpenApiGeneratorCommandArgs({
      generator: "python",
      specPath: this.options.specPath,
      smithyJsonPath: this.options.smithyJsonModelPath,
      generatorDirectory: OtherGenerators.PYTHON_LAMBDA_HANDLERS,
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-module-name": this.options.generatedPythonTypes.moduleName,
      },
    });
  };
}
