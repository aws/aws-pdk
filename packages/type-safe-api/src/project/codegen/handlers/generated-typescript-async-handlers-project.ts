/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptHandlersBaseProject,
  GeneratedTypescriptHandlersBaseProjectOptions,
} from "./generated-typescript-handlers-base-project";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../components/open-api-generator-handlebars-ignore-file";
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

export interface GeneratedTypescriptAsyncHandlersProjectOptions
  extends GeneratedTypescriptHandlersBaseProjectOptions {}

export class GeneratedTypescriptAsyncHandlersProject extends GeneratedTypescriptHandlersBaseProject {
  protected readonly openapiGeneratorIgnore: OpenApiGeneratorIgnoreFile;

  constructor(options: GeneratedTypescriptAsyncHandlersProjectOptions) {
    super(options);

    // TODO: remove the below and use new codegen instead
    // Ignore everything for the regular open api generator pass
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    this.openapiGeneratorIgnore = openapiGeneratorIgnore;
    openapiGeneratorIgnore.addPatterns("/*", "**/*", "*");
    // Ignore everything but the handler files for the handlebars pass
    const openapiGeneratorHandlebarsIgnore =
      new OpenApiGeneratorHandlebarsIgnoreFile(this);
    openapiGeneratorHandlebarsIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      // This will be split into a file per targeted handler
      `!${this.srcdir}/__all_handlers.ts`,
      `!${this.testdir}/__all_tests.ts`
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    // TODO: remove in favour of parent task using new codegen
    this.generateTask.reset();
    this.generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );
  }

  public buildCodegenOptions(): CodegenOptions {
    /**
     * TODO: not currently used - adjust for new codegen
     */
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.TYPESCRIPT_ASYNC_LAMBDA_HANDLERS],
      metadata: {
        srcDir: this.srcdir,
        tstDir: this.testdir,
        runtimePackageName:
          this.options.generatedTypescriptTypes.package.packageName,
      },
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
      generatorDirectory: OtherGenerators.TYPESCRIPT_ASYNC_LAMBDA_HANDLERS,
      srcDir: this.srcdir,
      tstDir: this.testdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-package-name":
          this.options.generatedTypescriptTypes.package.packageName,
      },
    };
  }
}
