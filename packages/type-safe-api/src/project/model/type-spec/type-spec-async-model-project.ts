/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodeProject, NodeProjectOptions } from "projen/lib/javascript";
import { TypeSpecDefinitionOptions } from "./type-spec-definition";
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
import { TypeSpecAsyncDefinition } from "./type-spec-async-definition";

/**
 * Options for the TypeSpec WebSocket API model project
 */
export interface TypeSpecAsyncModelProjectOptions
  extends NodeProjectOptions,
    TypeSpecDefinitionOptions,
    TypeSafeApiAsyncModelBuildOutputOptions,
    TypeSafeApiModelBuildOutputOptions {}

/**
 * Model project for defining a WebSocket API in TypeSpec
 */
export class TypeSpecAsyncModelProject extends NodeProject {
  public readonly apiName: string;
  public readonly definition: TypeSpecAsyncDefinition;

  constructor(options: TypeSpecAsyncModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    // Add the TypeSpec model
    this.definition = new TypeSpecAsyncDefinition(this, options);
    this.apiName = options.typeSpecOptions.namespace;

    // Add the model build to parse/bundle the generated openapi spec
    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    // Add the async model build to generate the AsyncAPI specification for docs generation
    new TypeSafeApiAsyncModelBuild(this, {
      parsedSpecFile: options.parsedSpecFile,
      asyncApiSpecFile: options.asyncApiSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.TYPESPEC,
      apiType: "async",
    });
  }
}
