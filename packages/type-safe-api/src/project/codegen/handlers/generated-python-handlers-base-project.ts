/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, SampleFile } from "projen";
import { PythonProject } from "projen/lib/python";
import { PythonVersion } from "../../languages";
import {
  CodeGenerationSourceOptions,
  GeneratedPythonHandlersOptions,
  Architecture,
} from "../../types";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildCodegenCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  TypeSafeApiScript,
} from "../components/utils";
import { GeneratedPythonRuntimeBaseProject } from "../runtime/generated-python-runtime-base-project";
import { RuntimeVersionUtils } from "../runtime-version-utils";

export interface GeneratedPythonHandlersBaseProjectOptions
  extends GeneratedPythonHandlersOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated python types
   */
  readonly generatedPythonTypes: GeneratedPythonRuntimeBaseProject;
}

export abstract class GeneratedPythonHandlersBaseProject extends PythonProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedPythonHandlersBaseProjectOptions;

  /**
   * Directory containing tests
   */
  protected readonly tstDir: string;

  /**
   * Python runtime version for the handlers
   */
  public readonly runtimeVersion: PythonVersion;

  constructor(options: GeneratedPythonHandlersBaseProjectOptions) {
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
    this.runtimeVersion = options.runtimeVersion ?? PythonVersion.PYTHON_3_13;
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
      RuntimeVersionUtils.PYTHON.getPythonDependencyVersion(
        this.runtimeVersion
      ),
      `${options.generatedPythonTypes.name}@{path="${path.relative(
        this.outdir,
        options.generatedPythonTypes.outdir
      )}", develop=true}`,
    ]
      .filter((dep) => !this.deps.tryGetDependency(dep, DependencyType.RUNTIME))
      .forEach((dep) => this.addDependency(dep));

    const generateTask = this.addTask("generate");
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns(".openapi-generator", ".tsapi-manifest");

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
      "poetry export --without-hashes --format=requirements.txt | sed -E 's/^-e[[:space:]]+//' > dist/lambda/requirements.txt"
    );
    // Select the platform based on the specified architecture, defaulting to x86_64
    // See: https://docs.aws.amazon.com/lambda/latest/dg/python-package.html#python-package-native-libraries
    const platform =
      options.architecture === Architecture.ARM_64
        ? "manylinux2014_aarch64"
        : "manylinux2014_x86_64";
    this.packageTask.exec(
      `pip install -r dist/lambda/requirements.txt --target dist/lambda --upgrade --platform ${platform} --only-binary :all: --python-version ${RuntimeVersionUtils.PYTHON.getPipPackagingPythonVersion(
        this.runtimeVersion
      )}`
    );
  }

  public buildGenerateCommandArgs = () => {
    return buildCodegenCommandArgs(this.buildCodegenOptions());
  };

  public abstract buildCodegenOptions(): CodegenOptions;
}
