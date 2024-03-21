/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, SampleDir } from "projen";

/**
 * Options for Smithy sample code
 */
export interface SmithySampleCodeOptions {
  /**
   * Directory in which the smithy sample code should be written
   */
  readonly modelDir: string;
  /**
   * Service namespace
   */
  readonly serviceNamespace: string;
  /**
   * Service name
   */
  readonly serviceName: string;
  /**
   * Optional first handler project language (to add the @handler trait to the sample operation)
   */
  readonly firstHandlerLanguage?: string;
}

/**
 * Defines sample code for a Smithy REST API
 */
export class SmithySampleCode extends SampleDir {
  constructor(
    project: Project,
    {
      modelDir,
      serviceName,
      serviceNamespace,
      firstHandlerLanguage,
    }: SmithySampleCodeOptions
  ) {
    super(project, modelDir, {
      files: {
        "main.smithy": `$version: "2"
namespace ${serviceNamespace}

use aws.protocols#restJson1

/// A sample smithy api
@restJson1
service ${serviceName} {
    version: "1.0"
    operations: [SayHello]
    errors: [
      BadRequestError
      NotAuthorizedError
      InternalFailureError
    ]
}`,
        "operations/say-hello.smithy": `$version: "2"
namespace ${serviceNamespace}

@readonly
@http(method: "GET", uri: "/hello")${
          firstHandlerLanguage
            ? `\n@handler(language: "${firstHandlerLanguage}")`
            : ""
        }
operation SayHello {
    input := {
        @httpQuery("name")
        @required
        name: String
    }
    output := {
        @required
        message: String
    }
    errors: [NotFoundError]
}
`,
        "types/errors.smithy": `$version: "2"
namespace ${serviceNamespace}

/// An error message
string ErrorMessage

/// An internal failure at the fault of the server
@error("server")
@httpError(500)
structure InternalFailureError {
    /// Message with details about the error
    @required
    message: ErrorMessage
}

/// An error at the fault of the client sending invalid input
@error("client")
@httpError(400)
structure BadRequestError {
    /// Message with details about the error
    @required
    message: ErrorMessage
}

/// An error due to the client attempting to access a missing resource
@error("client")
@httpError(404)
structure NotFoundError {
    /// Message with details about the error
    @required
    message: ErrorMessage
}

/// An error due to the client not being authorized to access the resource
@error("client")
@httpError(403)
structure NotAuthorizedError {
    /// Message with details about the error
    @required
    message: ErrorMessage
}
`,
      },
    });
  }
}
