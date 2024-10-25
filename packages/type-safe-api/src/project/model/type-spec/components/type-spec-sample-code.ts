/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, SampleDir } from "projen";
import { TypeSpecDefinitionOptions } from "../type-spec-definition";

/**
 * Options for TypeSpec sample code
 */
export interface TypeSpecSampleCodeOptions extends TypeSpecDefinitionOptions {
  /**
   * Location for the TypeSpec model
   */
  readonly modelDir: string;
}

/**
 * Defines sample code for a TypeSpec REST API
 */
export class TypeSpecSampleCode extends SampleDir {
  constructor(
    project: Project,
    { modelDir, typeSpecOptions, handlerLanguages }: TypeSpecSampleCodeOptions
  ) {
    const firstHandlerLanguage = handlerLanguages?.[0];

    super(project, modelDir, {
      files: {
        "main.tsp": `import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
import "../generated/aws-pdk/prelude.tsp";

import "./types/errors.tsp";

using Http;
using OpenAPI;

/**
 * A sample TypeSpec api
 */
@service({
  title: "${typeSpecOptions.namespace}",
})
@info({
  version: "1.0",
})
namespace ${typeSpecOptions.namespace};

${
  firstHandlerLanguage
    ? `@handler({ language: "${firstHandlerLanguage}" })
`
    : ""
}@get
@route("/hello")
op SayHello(@query name: string):
  | {
    @statusCode statusCode: 200;
    @body body: {
      message: string;
    };
  }
  | BadRequestError
  | NotAuthorizedError
  | NotFoundError
  | InternalFailureError;
`,
        "types/errors.tsp": `import "@typespec/http";

using Http;

/**
 * An error at the fault of the client sending invalid input
 */
model BadRequestErrorResponseContent {
  /**
   * Message with details about the error
   */
  message: string;
}

/**
 * An internal failure at the fault of the server
 */
model InternalFailureErrorResponseContent {
  /**
   * Message with details about the error
   */
  message: string;
}

/**
 * An error due to the client not being authorized to access the resource
 */
model NotAuthorizedErrorResponseContent {
  /**
   * Message with details about the error
   */
  message: string;
}

/**
 * An error due to the client attempting to access a missing resource
 */
model NotFoundErrorResponseContent {
  /**
   * Message with details about the error
   */
  message: string;
}

/**
 * BadRequestError 400 response
 */
@error
model BadRequestError {
  @statusCode statusCode: 400;
  @body body: BadRequestErrorResponseContent;
}

/**
 * NotAuthorizedError 403 response
 */
@error
model NotAuthorizedError {
  @statusCode statusCode: 403;
  @body body: NotAuthorizedErrorResponseContent;
}

/**
 * NotFoundError 404 response
 */
@error
model NotFoundError {
  @statusCode statusCode: 404;
  @body body: NotFoundErrorResponseContent;
}

/**
 * InternalFailureError 500 response
 */
@error
model InternalFailureError {
  @statusCode statusCode: 500;
  @body body: InternalFailureErrorResponseContent;
}
`,
      },
    });
  }
}
