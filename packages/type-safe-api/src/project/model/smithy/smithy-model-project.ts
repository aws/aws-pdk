/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, ProjectOptions } from "projen";
import { SmithyDefinition, SmithyDefinitionOptions } from "./smithy-definition";
import { TypeSafeApiCommandEnvironment } from "../../codegen/components/type-safe-api-command-environment";
import { ModelLanguage } from "../../types";
import { ModelReadme } from "../model-readme";
import {
  TypeSafeApiModelBuild,
  TypeSafeApiModelBuildOutputOptions,
} from "../type-safe-api-model-build";

/**
 * Options for the Smithy REST API model
 */
export interface SmithyModelProjectOptions
  extends ProjectOptions,
    SmithyDefinitionOptions,
    TypeSafeApiModelBuildOutputOptions {}

/**
 * Smithy model project for a REST API
 */
export class SmithyModelProject extends Project {
  /**
   * Name of the API
   */
  public readonly apiName: string;
  /**
   * Smithy model and build settings
   */
  public readonly definition: SmithyDefinition;

  constructor(options: SmithyModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.definition = new SmithyDefinition(this, options);
    this.apiName = options.smithyOptions.serviceName.serviceName;

    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      smithyJsonModelPath: this.definition.smithyJsonModelPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.SMITHY,
      apiType: "rest",
    });
  }
}
