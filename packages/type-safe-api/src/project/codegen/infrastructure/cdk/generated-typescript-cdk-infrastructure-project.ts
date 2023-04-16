/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { Language } from "../../../languages";
import { buildGenerateCdkInfrastructureCommand } from "../../components/utils";
import { GeneratedTypescriptRuntimeProject } from "../../runtime/generated-typescript-runtime-project";

export interface GeneratedTypescriptCdkInfrastructureProjectOptions
  extends TypeScriptProjectOptions {
  /**
   * OpenAPI spec path, relative to the project outdir
   */
  readonly specPath: string;
  /**
   * Generated typescript types project
   */
  readonly generatedTypescriptTypes: GeneratedTypescriptRuntimeProject;

  /**
   * Whether the infrastructure and client projects are parented by an nx-monorepo or not
   */
  readonly isWithinMonorepo?: boolean;
}

export class GeneratedTypescriptCdkInfrastructureProject extends TypeScriptProject {
  /**
   * Path to the openapi specification
   * @private
   */
  private readonly specPath: string;

  /**
   * The generated typescript types
   * @private
   */
  private readonly generatedTypescriptTypes: GeneratedTypescriptRuntimeProject;

  constructor(options: GeneratedTypescriptCdkInfrastructureProjectOptions) {
    super({
      ...options,
      sampleCode: false,
      jest: false,
      eslint: false,
      prettier: false,
      tsconfig: {
        compilerOptions: {
          lib: ["dom", "es2019"],
        },
      },
    });
    this.specPath = options.specPath;
    this.generatedTypescriptTypes = options.generatedTypescriptTypes;

    this.addDeps(
      ...[
        "@aws-prototyping-sdk/type-safe-api",
        "constructs",
        "aws-cdk-lib",
        "cdk-nag",
        // If within a monorepo, add a regular dependency. Otherwise, use a file dependency to ensure the types can be
        // resolved
        options.isWithinMonorepo
          ? options.generatedTypescriptTypes.package.packageName
          : `${
              options.generatedTypescriptTypes.package.packageName
            }@file:${path.relative(
              this.outdir,
              options.generatedTypescriptTypes.outdir
            )}`,
      ].filter(
        (dep) => !this.deps.tryGetDependency(dep, DependencyType.RUNTIME)
      )
    );

    const generateInfraCommand = this.buildGenerateCommand();

    const generateTask = this.addTask("generate");
    generateTask.exec(generateInfraCommand.command, {
      cwd: path.relative(this.outdir, generateInfraCommand.workingDir),
    });

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns("src");

    // If we're not in a monorepo, we need to link the generated types such that the local dependency can be resolved
    if (!options.isWithinMonorepo) {
      switch (this.package.packageManager) {
        case NodePackageManager.NPM:
        case NodePackageManager.YARN:
        case NodePackageManager.YARN2:
          this.tasks
            .tryFind("install")
            ?.prependExec(
              `${this.package.packageManager} link ${this.generatedTypescriptTypes.package.packageName}`
            );
          break;
        case NodePackageManager.PNPM:
          this.tasks
            .tryFind("install")
            ?.prependExec(
              `${this.package.packageManager} link /${path.relative(
                this.outdir,
                this.generatedTypescriptTypes.outdir
              )}`
            );
          break;
        default:
          console.warn(
            `Unknown package manager ${this.package.packageManager}. Cannot link generated typescript client.`
          );
      }
    }
  }

  public buildGenerateCommand = () => {
    return buildGenerateCdkInfrastructureCommand({
      language: Language.TYPESCRIPT,
      sourcePath: path.join(this.outdir, this.srcdir),
      generatedTypesPackage: this.generatedTypescriptTypes.package.packageName,
      infraPackage: this.package.packageName,
      // Spec path relative to the source directory
      specPath: path.join("..", this.specPath),
    });
  };
}
