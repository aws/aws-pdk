/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, SampleFile } from "projen";
import { PythonProject } from "projen/lib/python";
import {
  CodeGenerationSourceOptions,
  GeneratedPythonHandlersOptions,
  Architecture,
} from "../../types";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../components/open-api-generator-handlebars-ignore-file";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
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

  /**
   * Directory containing tests
   * @private
   */
  private readonly tstDir: string;

  constructor(options: GeneratedPythonHandlersProjectOptions) {
    super({
      pytest: true,
      poetryOptions: {
        packages: [{ include: options.moduleName }],
        // Module must be explicitly added to include since poetry excludes everything in .gitignore by default
        include: [options.moduleName!, `${options.moduleName}/**/*.py`],
      },
      ...(options as any),
      sample: false,
      poetry: true,
    });
    TypeSafeApiCommandEnvironment.ensure(this);
    this.options = options;

    this.tstDir = "test";

    if (options.pytest ?? true) {
      // Pytest fails with exit code 5 when there are no tests.
      // We want to allow users to delete all their tests, or to upgrade an existing project without breaking their build
      // See: https://github.com/pytest-dev/pytest/issues/2393
      this.testTask.reset(
        `pytest ${this.tstDir}/ || ([ $? = 5 ] && exit 0 || exit $?)`
      );
    }

    [
      "python@^3.11",
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
      `!${this.moduleName}/__all_handlers.py`,
      `!${this.tstDir}/__all_tests.py`
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
    // Select the platform based on the specified architecture, defaulting to x86_64
    // See: https://docs.aws.amazon.com/lambda/latest/dg/python-package.html#python-package-native-libraries
    const platform =
      options.architecture === Architecture.ARM_64
        ? "manylinux2014_aarch64"
        : "manylinux2014_x86_64";
    this.packageTask.exec(
      `pip install -r dist/lambda/requirements.txt --target dist/lambda --upgrade --platform ${platform} --only-binary :all:`
    );
  }

  public buildGenerateCommandArgs = () => {
    return buildInvokeOpenApiGeneratorCommandArgs({
      generator: "python-nextgen",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.PYTHON_LAMBDA_HANDLERS,
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      tstDir: this.tstDir,
      additionalProperties: {
        packageName: this.moduleName,
        projectName: this.name,
      },
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-module-name": this.options.generatedPythonTypes.moduleName,
      },
    });
  };
}
