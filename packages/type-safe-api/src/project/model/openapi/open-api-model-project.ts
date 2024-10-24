/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions } from "projen";
import {
  OpenApiDefinition,
  OpenApiDefinitionOptions,
} from "./open-api-definition";
import { TypeSafeApiCommandEnvironment } from "../../codegen/components/type-safe-api-command-environment";
import { ModelLanguage } from "../../types";
import { ModelReadme } from "../model-readme";
import {
  TypeSafeApiModelBuild,
  TypeSafeApiModelBuildOutputOptions,
} from "../type-safe-api-model-build";

export interface OpenApiModelProjectOptions
  extends ProjectOptions,
    OpenApiDefinitionOptions,
    TypeSafeApiModelBuildOutputOptions {}

/**
 * Project for defining an OpenAPI model for a REST API
 */
export class OpenApiModelProject extends Project {
  /**
   * Name of the API
   */
  public readonly apiName: string;

  /**
   * OpenAPI specification component
   */
  public readonly definition: OpenApiDefinition;

  constructor(options: OpenApiModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.definition = new OpenApiDefinition(this, options);

    this.apiName = options.openApiOptions.title;

    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.OPENAPI,
      apiType: "rest",
    });
  }
}
