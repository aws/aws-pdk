/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { SampleFile, Component } from "projen";
import { OpenApiModelOptions } from "../../types";
import { TypeSafeApiModelProject } from "../type-safe-api-model-project";

/**
 * Options for the OpenAPI Spec
 */
export interface OpenApiDefinitionOptions {
  /**
   * Options for the openapi model
   */
  readonly openApiOptions: OpenApiModelOptions;
}

/**
 * The OpenAPI Spec
 */
export class OpenApiDefinition extends Component {
  /**
   * Path to the root OpenAPI specification file
   */
  public readonly openApiSpecificationPath: string =
    "src/main/openapi/main.yaml";

  constructor(
    project: TypeSafeApiModelProject,
    options: OpenApiDefinitionOptions
  ) {
    super(project);

    // Create a sample OpenAPI spec yaml if not defined
    new SampleFile(project, this.openApiSpecificationPath, {
      contents: `openapi: 3.0.3
info:
  version: 1.0.0
  title: ${options.openApiOptions.title}
paths:
  /hello:
    get:
      operationId: sayHello
      parameters:
        - in: query
          name: name
          schema:
            type: string
          required: true
      responses:
        '200':
          description: Successful response
          content:
            'application/json':
              schema:
                $ref: '#/components/schemas/SayHelloResponseContent'
        '400':
          description: Error response
          content:
            'application/json':
              schema:
                $ref: '#/components/schemas/ApiErrorResponseContent'
components:
  schemas:
    ApiErrorResponseContent:
      type: object
      properties:
        errorMessage:
          type: string
      required:
        - errorMessage
    SayHelloResponseContent:
      type: object
      properties:
        message:
          type: string
      required:
        - message
`,
    });
  }
}
