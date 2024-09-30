/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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
 * Configuration for the generated typescript websocket client project
 */
export interface TypescriptWebsocketClientLibraryOptions
  extends GeneratedTypescriptLibraryProjectOptions {}

/**
 * Typescript project containing a generated websocket client
 */
export class TypescriptWebsocketClientLibrary extends GeneratedTypescriptLibraryProject {
  /**
   * Patterns that are excluded from code generation
   */
  public static openApiIgnorePatterns: string[] = [
    "package.json",
    "tsconfig.json",
    "tsconfig.esm.json",
    ".npmignore",
  ];

  protected readonly openapiGeneratorIgnore: OpenApiGeneratorIgnoreFile;

  constructor(options: TypescriptWebsocketClientLibraryOptions) {
    super(options);

    this.addDeps(
      // Browser + node compatible websockets
      "ws@^8",
      "isomorphic-ws@^5",
      // For sigv4 signing
      "@aws-crypto/sha256-js",
      "@aws-sdk/signature-v4",
      "@aws-sdk/protocol-http",
      "@aws-sdk/types",
      "uuid@^9"
    );
    this.addDeps("@types/ws@^8", "@types/uuid@^9");

    // Tell OpenAPI Generator CLI not to generate files that we will generate via this project, or don't need.
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    this.openapiGeneratorIgnore = openapiGeneratorIgnore;
    openapiGeneratorIgnore.addPatterns(
      ...TypescriptWebsocketClientLibrary.openApiIgnorePatterns
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
      // Skip generating http clients
      `${this.srcdir}/apis/*`,
      `${this.srcdir}/apis/**/*`
    );
  }

  protected buildCodegenOptions(): CodegenOptions {
    // TODO: update when switch to new codegen
    return {
      specPath: this.options.specPath,
      templateDirs: [WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT],
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
      generatorDirectory: WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT,
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
    };
  }
}
