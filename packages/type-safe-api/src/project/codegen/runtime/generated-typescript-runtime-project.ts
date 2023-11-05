/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodePackageUtils } from "@aws/monorepo";
import { IgnoreFile } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import { Language } from "../../languages";
import {
  CodeGenerationSourceOptions,
  GeneratedTypeScriptRuntimeOptions,
} from "../../types";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../components/utils";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptTypesProjectOptions
  extends GeneratedTypeScriptRuntimeOptions,
    CodeGenerationSourceOptions {
  /**
   * Whether this project is parented by an monorepo or not
   */
  readonly isWithinMonorepo?: boolean;
}

/**
 * Typescript project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedTypescriptRuntimeProject extends TypeScriptProject {
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
   * @private
   */
  private readonly options: GeneratedTypescriptTypesProjectOptions;

  constructor(options: GeneratedTypescriptTypesProjectOptions) {
    super({
      ...(options as any),
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

    // For event and context types
    this.addDeps(
      "@types/aws-lambda",
      "@aws-lambda-powertools/tracer",
      "@aws-lambda-powertools/logger",
      "@aws-lambda-powertools/metrics"
    );

    // Minimal .npmignore to avoid impacting OpenAPI Generator
    const npmignore = new IgnoreFile(this, ".npmignore");
    npmignore.addPatterns("/.projen/", "/src", "/dist");

    // Tell OpenAPI Generator CLI not to generate files that we will generate via this project, or don't need.
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    openapiGeneratorIgnore.addPatterns(
      ...GeneratedTypescriptRuntimeProject.openApiIgnorePatterns
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

    // Ignore all the generated code
    this.gitignore.addPatterns(
      "src",
      ".npmignore",
      "README.md",
      ".openapi-generator"
    );

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
    return buildInvokeOpenApiGeneratorCommandArgs({
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: Language.TYPESCRIPT,
      additionalProperties: {
        npmName: this.package.packageName,
        typescriptThreePlus: "true",
        useSingleParameter: "true",
        supportsES6: "true",
      },
      srcDir: this.srcdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
    });
  };
}
