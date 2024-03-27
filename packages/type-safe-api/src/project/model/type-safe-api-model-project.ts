/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { SampleFile } from "projen";
import { OpenApiDefinition } from "./openapi/open-api-definition";
import { OpenApiProjectDefinition } from "./openapi/open-api-project-definition";
import { SmithyDefinition } from "./smithy/smithy-definition";
import { SmithyProjectDefinition } from "./smithy/smithy-project-definition";
import {
  TypeSafeApiModelProjectBase,
  TypeSafeApiModelProjectBaseOptions,
} from "./type-safe-api-model-project-base";
import { Language } from "../languages";
import { OpenApiModelOptions, SmithyModelOptions } from "../types";

export interface TypeSafeApiModelProjectOptions
  extends TypeSafeApiModelProjectBaseOptions {}

export class TypeSafeApiModelProject extends TypeSafeApiModelProjectBase {
  /**
   * Reference to the Smithy definition component. Will be defined if the model language is Smithy
   */
  public readonly smithy?: SmithyDefinition;

  /**
   * Reference to the OpenAPI definition component. Will be defined if the model language is OpenAPI
   */
  public readonly openapi?: OpenApiDefinition;

  constructor(options: TypeSafeApiModelProjectOptions) {
    super(options);

    // Add the README as a sample file which the user may edit
    new SampleFile(this, "README.md", {
      sourcePath: path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "type-safe-api",
        "readme",
        "model-rest",
        `${options.modelLanguage}.md`
      ),
    });
  }

  protected addSmithyApiDefinition(
    options: SmithyModelOptions,
    handlerLanguages?: Language[] | undefined
  ): SmithyProjectDefinition {
    const smithy = new SmithyDefinition(this, {
      smithyOptions: options,
      handlerLanguages,
    });
    // @ts-ignore called from constructor
    this.smithy = smithy;
    return smithy;
  }

  protected addOpenApiDefinition(
    options: OpenApiModelOptions,
    handlerLanguages?: Language[] | undefined
  ): OpenApiProjectDefinition {
    const openapi = new OpenApiDefinition(this, {
      openApiOptions: options,
      handlerLanguages,
    });
    // @ts-ignore called from constructor
    this.openapi = openapi;
    return openapi;
  }
}
