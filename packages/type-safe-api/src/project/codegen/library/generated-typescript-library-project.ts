/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodePackageUtils } from "@aws/monorepo";
import { NodePackageManager } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import {
  CodeGenerationSourceOptions,
  GeneratedWithOpenApiGeneratorOptions,
} from "../../types";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  GenerationOptions,
  TypeSafeApiScript,
} from "../components/utils";

/**
 * Configuration for a generated typescript library
 */
export interface GeneratedTypescriptLibraryProjectOptions
  extends TypeScriptProjectOptions,
    GeneratedWithOpenApiGeneratorOptions,
    CodeGenerationSourceOptions {
  /**
   * Whether this project is parented by an monorepo or not
   */
  readonly isWithinMonorepo?: boolean;
}

/**
 * Typescript generated library project
 */
export abstract class GeneratedTypescriptLibraryProject extends TypeScriptProject {
  /**
   * Patterns that are excluded from code generation
   */
  public static openApiIgnorePatterns: string[] = [
    "package.json",
    "tsconfig.json",
    "tsconfig.esm.json",
    ".npmignore",
  ];

  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedTypescriptLibraryProjectOptions;

  protected readonly openapiGeneratorIgnore: OpenApiGeneratorIgnoreFile;

  constructor(options: GeneratedTypescriptLibraryProjectOptions) {
    super({
      ...options,
      sampleCode: false,
      tsconfig: {
        ...options.tsconfig,
        compilerOptions: {
          lib: ["dom", "es2019"],
          // Generated code isn't very strict!
          strict: false,
          alwaysStrict: false,
          noImplicitAny: false,
          noImplicitReturns: false,
          noImplicitThis: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
          strictNullChecks: false,
          strictPropertyInitialization: false,
          skipLibCheck: true,
          ...options?.tsconfig?.compilerOptions,
        },
      },
      eslint: false,
      // Disable tests unless explicitly enabled
      jest: options.jest ?? false,
      npmignoreEnabled: false,
    });
    TypeSafeApiCommandEnvironment.ensure(this);

    this.options = options;

    // Disable strict peer dependencies for pnpm as the default typescript project dependencies have type mismatches
    // (ts-jest@27 and @types/jest@28)
    if (this.package.packageManager === NodePackageManager.PNPM) {
      this.npmrc.addConfig("strict-peer-dependencies", "false");
    }

    // Tell OpenAPI Generator CLI not to generate files that we will generate via this project, or don't need.
    this.openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    this.openapiGeneratorIgnore.addPatterns(
      ...GeneratedTypescriptLibraryProject.openApiIgnorePatterns
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

    if (!options.commitGeneratedCode) {
      // Ignore all the generated code
      this.gitignore.addPatterns(
        "src",
        ".npmignore",
        "README.md",
        ".openapi-generator"
      );
    }

    // If we're not in a monorepo, we need to link the generated client such that any local dependency on it can be
    // resolved
    if (!options.isWithinMonorepo) {
      switch (this.package.packageManager) {
        case NodePackageManager.PNPM:
          // Nothing to do for pnpm, since the pnpm link command handles both the dependant and dependee
          break;
        default:
          this.tasks
            .tryFind("install")
            ?.exec(
              NodePackageUtils.command.cmd(this.package.packageManager, "link")
            );
          break;
      }
    }
  }

  public buildGenerateCommandArgs = () => {
    return buildInvokeOpenApiGeneratorCommandArgs(
      this.buildOpenApiGeneratorOptions()
    );
  };

  protected abstract buildOpenApiGeneratorOptions(): GenerationOptions;
}
