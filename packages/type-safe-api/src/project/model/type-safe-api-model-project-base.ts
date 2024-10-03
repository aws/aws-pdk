/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions, Task } from "projen";
import { OpenApiProjectDefinition } from "./openapi/open-api-project-definition";
import { SmithyProjectDefinition } from "./smithy/smithy-project-definition";
import { TypeSafeApiCommandEnvironment } from "../codegen/components/type-safe-api-command-environment";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../codegen/components/utils";
import { Language } from "../languages";
import {
  ModelLanguage,
  ModelOptions,
  OpenApiModelOptions,
  SmithyModelOptions,
} from "../types";

export interface TypeSafeApiModelProjectBaseOptions extends ProjectOptions {
  /**
   * Language the model is defined in
   */
  readonly modelLanguage: ModelLanguage;
  /**
   * Options for the model
   */
  readonly modelOptions: ModelOptions;
  /**
   * The languages users have specified for handler projects (if any)
   */
  readonly handlerLanguages?: Language[];
}

export abstract class TypeSafeApiModelProjectBase extends Project {
  /**
   * Name of the final bundled OpenAPI specification
   */
  public readonly parsedSpecFile: string = ".api.json";
  /**
   * Reference to the task used for generating the final bundled OpenAPI specification
   */
  public readonly generateTask: Task;

  /**
   * Name of the API. If Smithy, will resolve to serviceName otherwise it will use title.
   */
  public readonly apiName;

  constructor(options: TypeSafeApiModelProjectBaseOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.generateTask = this.addTask("generate");

    // Add the API definition
    const { specPath, smithyJsonModelPath } = this.addApiDefinition(options);

    this.apiName =
      options.modelOptions.smithy?.serviceName.serviceName ??
      options.modelOptions.openapi?.title;

    // Parse and bundle the openapi specification
    this.addParseAndBundleTask(specPath, smithyJsonModelPath);

    // Run the generate task as part of build
    this.compileTask.spawn(this.generateTask);
  }

  protected abstract addSmithyApiDefinition(
    options: SmithyModelOptions,
    handlerLanguages?: Language[]
  ): SmithyProjectDefinition;
  protected abstract addOpenApiDefinition(
    options: OpenApiModelOptions,
    handlerLanguages?: Language[]
  ): OpenApiProjectDefinition;

  private addApiDefinition = ({
    modelLanguage,
    modelOptions,
    handlerLanguages,
  }: TypeSafeApiModelProjectBaseOptions): {
    specPath: string;
    smithyJsonModelPath?: string;
  } => {
    if (modelLanguage === ModelLanguage.SMITHY) {
      if (!modelOptions.smithy) {
        throw new Error(
          `modelOptions.smithy is required when selected model language is ${ModelLanguage.SMITHY}`
        );
      }

      const smithyOptions = modelOptions.smithy;
      const smithy = this.addSmithyApiDefinition(
        smithyOptions,
        handlerLanguages
      );

      return {
        specPath: smithy.openApiSpecificationPath,
        smithyJsonModelPath: smithy.smithyJsonModelPath,
      };
    } else if (modelLanguage === ModelLanguage.OPENAPI) {
      if (!modelOptions.openapi) {
        throw new Error(
          `modelOptions.openapi is required when selected model language is ${ModelLanguage.OPENAPI}`
        );
      }

      const openApiOptions = modelOptions.openapi;
      const openapi = this.addOpenApiDefinition(
        openApiOptions,
        handlerLanguages
      );
      return { specPath: openapi.openApiSpecificationPath };
    } else {
      throw new Error(`Unknown model language ${modelLanguage}`);
    }
  };

  private addParseAndBundleTask = (
    openApiSpecificationPath: string,
    smithyJsonModelPath?: string
  ) => {
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.PARSE_OPENAPI_SPEC,
        `--specPath ${openApiSpecificationPath} --outputPath ${
          this.parsedSpecFile
        }${
          smithyJsonModelPath ? ` --smithyJsonPath ${smithyJsonModelPath}` : ""
        }`
      )
    );

    this.addGitIgnore(this.parsedSpecFile);
  };
}
