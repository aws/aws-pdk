/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodeProject, NodeProjectOptions } from "projen/lib/javascript";
import {
  TypeSpecDefinition,
  TypeSpecDefinitionOptions,
} from "./type-spec-definition";
import { TypeSafeApiCommandEnvironment } from "../../codegen/components/type-safe-api-command-environment";
import { ModelLanguage } from "../../types";
import { ModelReadme } from "../model-readme";
import {
  TypeSafeApiModelBuild,
  TypeSafeApiModelBuildOutputOptions,
} from "../type-safe-api-model-build";

/**
 * Options for the TypeSpec model project
 */
export interface TypeSpecModelProjectOptions
  extends NodeProjectOptions,
    TypeSpecDefinitionOptions,
    TypeSafeApiModelBuildOutputOptions {}

/**
 * Model project for defining a REST API in TypeSpec
 */
export class TypeSpecModelProject extends NodeProject {
  public readonly apiName: string;
  public readonly definition: TypeSpecDefinition;

  constructor(options: TypeSpecModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    // Add the TypeSpec model
    this.definition = new TypeSpecDefinition(this, options);
    this.apiName = options.typeSpecOptions.namespace;

    // Add the model build to parse/bundle our generated OpenAPI specification
    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.TYPESPEC,
      apiType: "rest",
    });
  }
}
