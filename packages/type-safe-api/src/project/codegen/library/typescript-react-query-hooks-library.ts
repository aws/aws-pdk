/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { NodePackageManager, TypeScriptJsxMode } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import { Library } from "../../languages";
import { GeneratedTypeScriptReactQueryHooksOptions } from "../../types";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../components/open-api-generator-handlebars-ignore-file";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommand,
} from "../components/utils";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptReactQueryHooksProjectOptions
  extends GeneratedTypeScriptReactQueryHooksOptions {
  /**
   * The path to the OpenAPI specification, relative to this project's outdir
   */
  readonly specPath: string;
  /**
   * Whether this project is parented by an nx-monorepo or not
   */
  readonly isWithinMonorepo?: boolean;
}

/**
 * Typescript project containing generated react-query hooks
 */
export class TypescriptReactQueryHooksLibrary extends TypeScriptProject {
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
   * Path to the openapi specification
   * @private
   */
  private readonly specPath: string;

  constructor(options: GeneratedTypescriptReactQueryHooksProjectOptions) {
    super({
      ...options,
      sampleCode: false,
      tsconfig: {
        ...options.tsconfig,
        compilerOptions: {
          jsx: TypeScriptJsxMode.REACT,
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
          ...options?.tsconfig?.compilerOptions,
        },
      },
      eslint: false,
      // Disable tests unless explicitly enabled
      jest: options.jest ?? false,
      npmignoreEnabled: false,
    });

    this.specPath = options.specPath;

    // Disable strict peer dependencies for pnpm as the default typescript project dependencies have type mismatches
    // (ts-jest@27 and @types/jest@28)
    if (this.package.packageManager === NodePackageManager.PNPM) {
      this.npmrc.addConfig("strict-peer-dependencies", "false");
    }

    // Add dependencies on react-query and react
    this.addDeps("@tanstack/react-query");
    this.addDevDeps("react", "@types/react");
    this.addPeerDeps("react");

    // Tell OpenAPI Generator CLI not to generate files that we will generate via this project, or don't need.
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    openapiGeneratorIgnore.addPatterns(
      ...TypescriptReactQueryHooksLibrary.openApiIgnorePatterns
    );
    // Ignore the hooks, since they're generated with the handlebars templating engine
    const hooksPattern = "**/*Hooks.ts";
    openapiGeneratorIgnore.addPatterns(hooksPattern);

    // The hooks are generated using the handlebars templating engine, so we include a handlebars ignore file
    const handlebarsIgnore = new OpenApiGeneratorHandlebarsIgnoreFile(this);
    handlebarsIgnore.addPatterns(`!${hooksPattern}`);

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    const generateCodeCommand = this.buildGenerateCommand();
    const cleanCommand = buildCleanOpenApiGeneratedCodeCommand(this.outdir);

    const generateTask = this.addTask("generate");
    generateTask.exec(cleanCommand.command, {
      cwd: path.relative(this.outdir, cleanCommand.workingDir),
    });
    generateTask.exec(generateCodeCommand.command, {
      cwd: path.relative(this.outdir, generateCodeCommand.workingDir),
    });

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
        case NodePackageManager.NPM:
        case NodePackageManager.YARN:
        case NodePackageManager.YARN2:
          this.tasks
            .tryFind("install")
            ?.exec(`${this.package.packageManager} link`);
          break;
        case NodePackageManager.PNPM:
          // Nothing to do for pnpm, since the pnpm link command handles both the dependant and dependee
          break;
        default:
          console.warn(
            `Unknown package manager ${this.package.packageManager}. Cannot link generated typescript runtime project.`
          );
      }
    }
  }

  public buildGenerateCommand = () => {
    return buildInvokeOpenApiGeneratorCommand({
      generator: "typescript-fetch",
      specPath: this.specPath,
      outputPath: this.outdir,
      generatorDirectory: Library.TYPESCRIPT_REACT_QUERY_HOOKS,
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
