/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedTypescriptCdkInfrastructureBaseProject,
  GeneratedTypescriptCdkInfrastructureBaseProjectOptions,
} from "./generated-typescript-cdk-infrastructure-base-project";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../../components/open-api-generator-handlebars-ignore-file";
import { OpenApiGeneratorIgnoreFile } from "../../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../../components/open-api-tools-json-file";
import {
  CodegenOptions,
  GenerationOptions,
  OtherGenerators,
  TypeSafeApiScript,
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  getHandlersProjectVendorExtensions,
} from "../../components/utils";

export interface GeneratedTypescriptAsyncCdkInfrastructureProjectOptions
  extends GeneratedTypescriptCdkInfrastructureBaseProjectOptions {}

export class GeneratedTypescriptAsyncCdkInfrastructureProject extends GeneratedTypescriptCdkInfrastructureBaseProject {
  protected readonly openapiGeneratorIgnore: OpenApiGeneratorIgnoreFile;

  constructor(
    options: GeneratedTypescriptAsyncCdkInfrastructureProjectOptions
  ) {
    super(options);

    // Ignore everything but the target files
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    this.openapiGeneratorIgnore = openapiGeneratorIgnore;
    openapiGeneratorIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      `!${this.srcdir}/index.ts`,
      `!${this.srcdir}/api.ts`,
      `!${this.srcdir}/mock-integrations.ts`
    );

    const openapiGeneratorHandlebarsIgnore =
      new OpenApiGeneratorHandlebarsIgnoreFile(this);
    openapiGeneratorHandlebarsIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      `!${this.srcdir}/__functions.ts`
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    // TODO: remove when switching to new codegen
    this.generateTask.reset();
    this.generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );
    // Copy the api spec to within the package
    this.generateTask.exec(`mkdir -p ${path.dirname(this.packagedSpecPath)}`);
    this.generateTask.exec(
      `cp -f ${this.options.specPath} ${this.packagedSpecPath}`
    );
  }

  public buildGenerateCommandArgs = (): string => {
    return buildInvokeOpenApiGeneratorCommandArgs(
      this.buildOpenApiGeneratorOptions()
    );
  };

  public buildCodegenOptions(): CodegenOptions {
    // TODO: unused, update for new codegen
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.TYPESCRIPT_ASYNC_CDK_INFRASTRUCTURE],
    };
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.TYPESCRIPT_ASYNC_CDK_INFRASTRUCTURE,
      srcDir: this.srcdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-package-name":
          this.options.generatedTypescriptTypes.package.packageName,
        // Spec path relative to the source directory
        "x-relative-spec-path": path.join("..", this.packagedSpecPath),
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }
}
