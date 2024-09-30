/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptRuntimeBaseProject,
  GeneratedTypescriptRuntimeBaseProjectOptions,
} from "./generated-typescript-runtime-base-project";
import { Language } from "../../languages";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  GenerationOptions,
  OtherGenerators,
  TypeSafeApiScript,
} from "../components/utils";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptAsyncRuntimeProjectOptions
  extends GeneratedTypescriptRuntimeBaseProjectOptions {}

/**
 * Typescript project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedTypescriptAsyncRuntimeProject extends GeneratedTypescriptRuntimeBaseProject {
  // TODO: remove
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

  constructor(options: GeneratedTypescriptAsyncRuntimeProjectOptions) {
    super(options);

    this.addDeps("@aws-sdk/client-apigatewaymanagementapi");

    // TODO: remove this in favour of new codegen
    // Tell OpenAPI Generator CLI not to generate files that we will generate via this project, or don't need.
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    this.openapiGeneratorIgnore = openapiGeneratorIgnore;
    openapiGeneratorIgnore.addPatterns(
      ...GeneratedTypescriptAsyncRuntimeProject.openApiIgnorePatterns
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    openapiGeneratorIgnore.addPatterns(
      // Skip generating http clients
      `${this.srcdir}/apis/**/*`,
      `${this.srcdir}/apis/*`
    );

    // TODO: remove this in favour of new codegen
    this.generateTask.reset();
    this.generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );
  }

  protected buildCodegenOptions(): CodegenOptions {
    // TODO: not currently used, adjust these when removing openapi generator for websocket apis
    return {
      specPath: this.options.specPath,
      templateDirs: [
        OtherGenerators.TYPESCRIPT_ASYNC_RUNTIME,
        `${Language.TYPESCRIPT}/templates/client/models`,
      ],
      metadata: {
        srcDir: this.srcdir,
      },
    };
  }

  public buildGenerateCommandArgs = (): string => {
    return buildInvokeOpenApiGeneratorCommandArgs(
      this.buildOpenApiGeneratorOptions()
    );
  };

  protected buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.TYPESCRIPT_ASYNC_RUNTIME,
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
