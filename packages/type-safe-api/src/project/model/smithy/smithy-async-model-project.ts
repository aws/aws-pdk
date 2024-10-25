/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions } from "projen";
import {
  SmithyAsyncDefinitionOptions,
  SmithyAsyncDefinition,
} from "./smithy-async-definition";
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
 * Options for the Smithy WebSocket API model project
 */
export interface SmithyAsyncModelProjectOptions
  extends ProjectOptions,
    SmithyAsyncDefinitionOptions,
    TypeSafeApiModelBuildOutputOptions,
    TypeSafeApiAsyncModelBuildOutputOptions {}

/**
 * Smithy model project for a WebSocket API
 */
export class SmithyAsyncModelProject extends Project {
  /**
   * Name of the API
   */
  public readonly apiName: string;
  /**
   * Smithy model and build settings
   */
  public readonly definition: SmithyAsyncDefinition;

  constructor(options: SmithyAsyncModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.definition = new SmithyAsyncDefinition(this, options);
    this.apiName = options.smithyOptions.serviceName.serviceName;

    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      smithyJsonModelPath: this.definition.smithyJsonModelPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    new TypeSafeApiAsyncModelBuild(this, {
      parsedSpecFile: options.parsedSpecFile,
      asyncApiSpecFile: options.asyncApiSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.SMITHY,
      apiType: "async",
    });
  }
}
