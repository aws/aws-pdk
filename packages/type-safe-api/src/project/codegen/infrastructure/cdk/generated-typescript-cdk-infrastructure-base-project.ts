/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, IgnoreFile, Task } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import {
  CodeGenerationSourceOptions,
  GeneratedProjectOptions,
} from "../../../types";
import { TypeSafeApiCommandEnvironment } from "../../components/type-safe-api-command-environment";
import {
  buildCodegenCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  TypeSafeApiScript,
} from "../../components/utils";
import { GeneratedHandlersProjects } from "../../generate";
import { GeneratedTypescriptRuntimeBaseProject } from "../../runtime/generated-typescript-runtime-base-project";

export interface GeneratedTypescriptInfrastructureBaseOptions
  extends TypeScriptProjectOptions,
    GeneratedProjectOptions {}

export interface GeneratedTypescriptCdkInfrastructureBaseProjectOptions
  extends GeneratedTypescriptInfrastructureBaseOptions,
    CodeGenerationSourceOptions {
  /**
   * Generated typescript types project
   */
  readonly generatedTypescriptTypes: GeneratedTypescriptRuntimeBaseProject;

  /**
   * Generated handlers projects
   */
  readonly generatedHandlers: GeneratedHandlersProjects;

  /**
   * Whether the infrastructure and client projects are parented by an monorepo or not
   */
  readonly isWithinMonorepo?: boolean;
}

export abstract class GeneratedTypescriptCdkInfrastructureBaseProject extends TypeScriptProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedTypescriptCdkInfrastructureBaseProjectOptions;

  /**
   * Path to the packaged copy of the openapi specification
   */
  protected readonly packagedSpecPath = "assets/api.json";

  protected readonly generateTask: Task;

  constructor(options: GeneratedTypescriptCdkInfrastructureBaseProjectOptions) {
    super({
      ...(options as any),
      sampleCode: false,
      jest: false,
      eslint: false,
      prettier: false,
      tsconfig: {
        compilerOptions: {
          lib: ["dom", "es2019"],
          // Generated code imports all models, and may not reference them all
          noUnusedLocals: false,
          noUnusedParameters: false,
          skipLibCheck: true,
          ...options?.tsconfig?.compilerOptions,
        },
      },
      npmignoreEnabled: false,
    });
    TypeSafeApiCommandEnvironment.ensure(this);
    this.options = options;

    this.addDevDeps("@types/aws-lambda");
    this.addDeps(
      ...[
        // If within a monorepo, add a regular dependency. Otherwise, use a file dependency to ensure the types can be
        // resolved
        options.isWithinMonorepo
          ? `${options.generatedTypescriptTypes.package.packageName}@${options.generatedTypescriptTypes.package.manifest.version}`
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

    const devAndPeerDeps = ["@aws/pdk", "constructs", "aws-cdk-lib", "cdk-nag"];
    this.addDevDeps(
      ...devAndPeerDeps.filter(
        (dep) => !this.deps.tryGetDependency(dep, DependencyType.BUILD)
      )
    );
    this.addPeerDeps(
      ...devAndPeerDeps.filter(
        (dep) => !this.deps.tryGetDependency(dep, DependencyType.PEER)
      )
    );

    // Minimal .npmignore to avoid impacting OpenAPI Generator
    const npmignore = new IgnoreFile(this, ".npmignore");
    npmignore.addPatterns("/.projen/", "/src", "/dist");

    const generateTask = this.addTask("generate");
    this.generateTask = generateTask;
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    // Copy the api spec to within the package
    generateTask.exec(`mkdir -p ${path.dirname(this.packagedSpecPath)}`);
    generateTask.exec(
      `cp -f ${this.options.specPath} ${this.packagedSpecPath}`
    );
    if (!options.commitGeneratedCode) {
      this.gitignore.addPatterns(`/${this.packagedSpecPath}`);
    }

    this.preCompileTask.spawn(generateTask);

    if (!options.commitGeneratedCode) {
      // Ignore the generated code
      this.gitignore.addPatterns(this.srcdir, "mocks");
    }

    this.gitignore.addPatterns(".openapi-generator", ".tsapi-manifest");

    // If we're not in a monorepo, we need to link the generated types such that the local dependency can be resolved
    if (!options.isWithinMonorepo) {
      switch (this.package.packageManager) {
        case NodePackageManager.PNPM:
          this.tasks
            .tryFind("install")
            ?.prependExec(
              `${this.package.packageManager} link /${path.relative(
                this.outdir,
                this.options.generatedTypescriptTypes.outdir
              )}`
            );
          break;
        default:
          this.tasks
            .tryFind("install")
            ?.prependExec(
              `${this.package.packageManager} link ${this.options.generatedTypescriptTypes.package.packageName}`
            );
          break;
      }
    }
  }

  public buildGenerateCommandArgs = () => {
    return buildCodegenCommandArgs(this.buildCodegenOptions());
  };

  protected abstract buildCodegenOptions(): CodegenOptions;
}
