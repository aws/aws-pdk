/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeScriptJsxMode } from "projen/lib/javascript";
import {
  GeneratedTypescriptLibraryProject,
  GeneratedTypescriptLibraryProjectOptions,
} from "./generated-typescript-library-project";
import { WebSocketLibrary } from "../../languages";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  GenerationOptions,
  TypeSafeApiScript,
} from "../components/utils";

/**
 * Configuration for the generated typescript websocket hooks project
 */
export interface TypescriptWebsocketHooksLibraryOptions
  extends GeneratedTypescriptLibraryProjectOptions {
  readonly clientPackageName: string;
}

/**
 * Typescript project containing generated websocket hooks
 */
export class TypescriptWebsocketHooksLibrary extends GeneratedTypescriptLibraryProject {
  /**
   * Patterns that are excluded from code generation
   */
  public static openApiIgnorePatterns: string[] = [
    "package.json",
    "tsconfig.json",
    "tsconfig.esm.json",
    ".npmignore",
  ];

  protected readonly options: TypescriptWebsocketHooksLibraryOptions;

  protected readonly openapiGeneratorIgnore: OpenApiGeneratorIgnoreFile;

  constructor(options: TypescriptWebsocketHooksLibraryOptions) {
    super({
      ...options,
      tsconfig: options.tsconfig ?? {
        compilerOptions: {
          jsx: TypeScriptJsxMode.REACT,
        },
      },
    });
    this.options = options;

    this.addDevDeps("react", "@types/react");
    this.addPeerDeps("react");

    // Tell OpenAPI Generator CLI not to generate files that we will generate via this project, or don't need.
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    this.openapiGeneratorIgnore = openapiGeneratorIgnore;
    openapiGeneratorIgnore.addPatterns(
      ...TypescriptWebsocketHooksLibrary.openApiIgnorePatterns
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    this.generateTask.reset();
    this.generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    openapiGeneratorIgnore.addPatterns(
      // Ignore all but relevant hooks files
      ...OpenApiGeneratorIgnoreFile.ALL_FILES_PATTERNS,
      `!${this.srcdir}/index.ts`,
      `!${this.srcdir}/hooks/*`,
      `!${this.srcdir}/hooks/**/*`
    );
  }

  protected buildCodegenOptions(): CodegenOptions {
    // TODO: update when switch to new codegen
    return {
      specPath: this.options.specPath,
      templateDirs: [WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS],
    };
  }

  public buildGenerateCommandArgs = (): string => {
    return buildInvokeOpenApiGeneratorCommandArgs(
      this.buildOpenApiGeneratorOptions()
    );
  };

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS,
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
      extraVendorExtensions: {
        "x-websocket-client-package-name": this.options.clientPackageName,
      },
    };
  }
}
