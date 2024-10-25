/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions } from "projen";
import {
  OpenApiAsyncDefinitionOptions,
  OpenApiAsyncDefinition,
} from "./open-api-async-definition";
import { TypeSafeApiCommandEnvironment } from "../../codegen/components/type-safe-api-command-environment";
import { ModelLanguage } from "../../types";
import { ModelReadme } from "../model-readme";
import {
  TypeSafeApiAsyncModelBuild,
  TypeSafeApiAsyncModelBuildOutputOptions,
} from "../type-safe-api-async-model-build";
import {
  TypeSafeApiModelBuild,
  TypeSafeApiModelBuildOutputOptions,
} from "../type-safe-api-model-build";

/**
 * Options for an OpenAPI WebSocket API model
 */
export interface OpenApiAsyncModelProjectOptions
  extends ProjectOptions,
    OpenApiAsyncDefinitionOptions,
    TypeSafeApiModelBuildOutputOptions,
    TypeSafeApiAsyncModelBuildOutputOptions {}

/**
 * Project for defining an OpenAPI model for a WebSocket API
 */
export class OpenApiAsyncModelProject extends Project {
  /**
   * Name of the API
   */
  public readonly apiName: string;
  /**
   * OpenAPI specification component
   */
  public readonly definition: OpenApiAsyncDefinition;

  constructor(options: OpenApiAsyncModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.definition = new OpenApiAsyncDefinition(this, options);

    this.apiName = options.openApiOptions.title;

    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    new TypeSafeApiAsyncModelBuild(this, {
      parsedSpecFile: options.parsedSpecFile,
      asyncApiSpecFile: options.asyncApiSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.OPENAPI,
      apiType: "async",
    });
  }
}
