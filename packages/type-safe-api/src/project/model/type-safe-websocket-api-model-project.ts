/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { SampleFile } from "projen";
import { OpenApiAsyncDefinition } from "./openapi/open-api-async-definition";
import { OpenApiProjectDefinition } from "./openapi/open-api-project-definition";
import { SmithyAsyncDefinition } from "./smithy/smithy-async-definition";
import { SmithyProjectDefinition } from "./smithy/smithy-project-definition";
import {
  TypeSafeApiModelProjectBase,
  TypeSafeApiModelProjectBaseOptions,
} from "./type-safe-api-model-project-base";
import { Language } from "../languages";
import { OpenApiModelOptions, SmithyModelOptions } from "../types";

export interface TypeSafeWebSocketApiModelProjectOptions
  extends TypeSafeApiModelProjectBaseOptions {}

export class TypeSafeWebSocketApiModelProject extends TypeSafeApiModelProjectBase {
  /**
   * Reference to the Smithy definition component. Will be defined if the model language is Smithy
   */
  public readonly smithy?: SmithyAsyncDefinition;

  /**
   * Reference to the OpenAPI definition component. Will be defined if the model language is OpenAPI
   */
  public readonly openapi?: OpenApiAsyncDefinition;

  constructor(options: TypeSafeWebSocketApiModelProjectOptions) {
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
        "model-async",
        `${options.modelLanguage}.md`
      ),
    });
  }

  protected addSmithyApiDefinition(
    options: SmithyModelOptions,
    handlerLanguages?: Language[] | undefined
  ): SmithyProjectDefinition {
    const smithy = new SmithyAsyncDefinition(this, {
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
    const openapi = new OpenApiAsyncDefinition(this, {
      openApiOptions: options,
      handlerLanguages,
    });
    // @ts-ignore called from constructor
    this.openapi = openapi;
    return openapi;
  }
}
