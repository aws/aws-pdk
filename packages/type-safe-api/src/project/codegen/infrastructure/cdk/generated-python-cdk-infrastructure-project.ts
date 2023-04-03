/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType } from "projen";
import { PythonProject, PythonProjectOptions } from "projen/lib/python";
import { Language } from "../../../languages";
import { buildGenerateCdkInfrastructureCommand } from "../../components/utils";
import { GeneratedPythonRuntimeProject } from "../../runtime/generated-python-runtime-project";

export interface GeneratedPythonCdkInfrastructureProjectOptions
  extends PythonProjectOptions {
  /**
   * OpenAPI spec path, relative to the project outdir
   */
  readonly specPath: string;
  /**
   * The generated python types
   */
  readonly generatedPythonTypes: GeneratedPythonRuntimeProject;
}

export class GeneratedPythonCdkInfrastructureProject extends PythonProject {
  /**
   * Path to the openapi specification
   * @private
   */
  private readonly specPath: string;

  /**
   * The generated python types
   * @private
   */
  private readonly generatedPythonTypes: GeneratedPythonRuntimeProject;

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
    this.specPath = options.specPath;
    this.generatedPythonTypes = options.generatedPythonTypes;

    [
      "aws_prototyping_sdk.type_safe_api@^0.0.0",
      "constructs@^10.0.0",
      "aws-cdk-lib@^2.0.0",
      "cdk-nag@^2.0.0",
      `${options.generatedPythonTypes.name}@{path="${path.relative(
        this.outdir,
        options.generatedPythonTypes.outdir
      )}", develop=true}`,
    ]
      .filter((dep) => !this.deps.tryGetDependency(dep, DependencyType.RUNTIME))
      .forEach((dep) => this.addDependency(dep));

    const generateInfraCommand = this.buildGenerateCommand();

    const generateTask = this.addTask("generate");
    generateTask.exec(generateInfraCommand.command, {
      cwd: path.relative(this.outdir, generateInfraCommand.workingDir),
    });

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns(this.moduleName);
  }

  public buildGenerateCommand = () => {
    return buildGenerateCdkInfrastructureCommand({
      language: Language.PYTHON,
      sourcePath: path.join(this.outdir, this.moduleName),
      generatedTypesPackage: this.generatedPythonTypes.moduleName,
      infraPackage: this.moduleName,
      // Spec path relative to the source directory
      specPath: path.join("..", this.specPath),
    });
  };
}
