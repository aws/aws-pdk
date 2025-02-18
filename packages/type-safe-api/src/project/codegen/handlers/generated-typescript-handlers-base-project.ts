/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, IgnoreFile, SampleDir, Task } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import { NodeVersion } from "../../languages";
import {
  CodeGenerationSourceOptions,
  GeneratedTypeScriptHandlersOptions,
} from "../../types";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildCodegenCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  TypeSafeApiScript,
} from "../components/utils";
import { GeneratedTypescriptRuntimeBaseProject } from "../runtime/generated-typescript-runtime-base-project";
import { RuntimeVersionUtils } from "../runtime-version-utils";

export interface GeneratedTypescriptHandlersBaseProjectOptions
  extends GeneratedTypeScriptHandlersOptions,
    CodeGenerationSourceOptions {
  /**
   * Generated typescript types project
   */
  readonly generatedTypescriptTypes: GeneratedTypescriptRuntimeBaseProject;

  /**
   * Whether the infrastructure and client projects are parented by an monorepo or not
   */
  readonly isWithinMonorepo?: boolean;
}

export abstract class GeneratedTypescriptHandlersBaseProject extends TypeScriptProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedTypescriptHandlersBaseProjectOptions;

  /**
   * Node runtime version for the handlers
   */
  public readonly runtimeVersion: NodeVersion;

  protected readonly generateTask: Task;

  constructor(options: GeneratedTypescriptHandlersBaseProjectOptions) {
    super({
      ...(options as any),
      sampleCode: false,
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
    this.options = options;
    this.runtimeVersion = options.runtimeVersion ?? NodeVersion.NODE_22;

    TypeSafeApiCommandEnvironment.ensure(this);

    this.addDeps(
      ...[
        // If within a monorepo, add a regular dependency. Otherwise, use a file dependency to ensure the runtime can be
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
    this.addDevDeps("esbuild", "@types/aws-lambda");

    // Minimal .npmignore to avoid impacting OpenAPI Generator
    const npmignore = new IgnoreFile(this, ".npmignore");
    npmignore.addPatterns("/.projen/", "/src", "/dist");

    this.generateTask = this.addTask("generate");
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    this.preCompileTask.spawn(this.generateTask);

    // Ignore the openapi generator metadata
    this.gitignore.addPatterns(".openapi-generator", ".tsapi-metadata");

    // Create a separate lambda bundle for each handler as part of the package task.
    // Note that every typescript file directly in src is bundled by default, but users may specify their own
    // entry point globs if they prefer a different directory structure.
    this.packageTask.exec(`mkdir -p dist/lambda && rm -rf dist/lambda/*`);

    this.packageTask.exec(
      `esbuild --bundle ${(
        options.handlerEntryPoints ?? [`${this.srcdir}/*.ts`]
      ).join(
        " "
      )} --platform=node --outdir=dist/lambda --target=${RuntimeVersionUtils.NODE.getEsbuildNodeTarget(
        this.runtimeVersion
      )}`
    );
    // Move each bundled file into a separate directory
    this.packageTask.exec(
      "for f in $(ls dist/lambda); do mkdir dist/lambda/$(basename $f .js) && mv dist/lambda/$f dist/lambda/$(basename $f .js)/index.js; done"
    );

    // Create an empty index.ts sample on synth so that tsc is happy if the handlers project is configured
    // but no operations have @handler(language: "typescript")
    new SampleDir(this, this.srcdir, {
      files: {
        "index.ts": "",
      },
    });

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
