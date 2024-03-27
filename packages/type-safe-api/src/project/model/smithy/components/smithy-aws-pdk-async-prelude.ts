/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, FileBase, IResolver } from "projen";
import { SmithyAwsPdkPrelude } from "./smithy-aws-pdk-prelude";
import { Language } from "../../../languages";

/**
 * Options for the aws-pdk/async.smithy file
 */
export interface SmithyAwsPdkAsyncPreludeOptions {
  /**
   * Path to the generated model directory in which to add the prelude
   */
  readonly generatedModelDir: string;
  /**
   * Namespace for the smithy service
   */
  readonly serviceNamespace: string;
  /**
   * Languages selected for handlers
   */
  readonly handlerLanguages?: Language[];
}

/**
 * Synthesize the aws-pdk/async.smithy file
 */
export class SmithyAwsPdkAsyncPrelude extends FileBase {
  private readonly options: SmithyAwsPdkAsyncPreludeOptions;

  constructor(project: Project, options: SmithyAwsPdkAsyncPreludeOptions) {
    super(
      project,
      path.join(options.generatedModelDir, "aws-pdk", "async.smithy"),
      {
        marker: true,
        readonly: true,
      }
    );
    this.options = options;
  }

  public synthesizeContent(_: IResolver): string | undefined {
    return `// ${this.marker}

$version: "2"

metadata validators = [

    {
        id: "MissingAsyncTrait"
        name: "EmitEachSelector"
        message: "Operation is missing @async trait"
        configuration: {
            selector: """
                operation :not([trait|com.aws#async])
            """
        }
    }

    {
        id: "MissingWebSocketProtocolTrait"
        name: "EmitEachSelector"
        message: "Service is missing @websocketJson trait"
        configuration: {
            selector: """
                service :not([trait|com.aws#websocketJson])
            """
        }
    }

    {
        id: "OperationMayNotHaveOutput"
        name: "EmitEachSelector"
        message: "Async operations must have no output"
        configuration: {
            selector: """
                operation -[output]->
            """
        }
    }

    {
        id: "OperationMustHaveInput"
        name: "EmitEachSelector"
        message: "Async operations must define an input"
        configuration: {
            selector: """
                operation :not(-[input]->)
            """
        }
    }

    {
        id: "HandlerTraitNotPermittedForServerToClient"
        name: "EmitEachSelector"
        message: "The @handler trait cannot be applied to an @async operation with direction server_to_client"
        configuration: {
            selector: """
              operation
              [@trait|com.aws#async: @{direction} = server_to_client]
              [trait|com.aws#handler]
            """
        }
    }

    ${SmithyAwsPdkPrelude.buildHandlerTraitValidators(
      this.options.serviceNamespace,
      "connectHandler",
      this.options.handlerLanguages
    )}
    ${SmithyAwsPdkPrelude.buildHandlerTraitValidators(
      this.options.serviceNamespace,
      "disconnectHandler",
      this.options.handlerLanguages
    )}
]

namespace ${this.options.serviceNamespace}

/// Add this trait to an asynchronous service
@trait(selector: "service")
structure websocketJson {}

enum AsyncDirection {
    CLIENT_TO_SERVER = "client_to_server"
    SERVER_TO_CLIENT = "server_to_client"
    BIDIRECTIONAL = "bidirectional"
}

/// Add this trait to all asynchronous operations
@trait(selector: "operation")
structure async {
    /// The direction this operation will be used in, used to inform the generated client and server sdks.
    @required
    direction: AsyncDirection
}

@trait(selector: "service")
structure connectHandler {
  @required
  language: String
}

@trait(selector: "service")
structure disconnectHandler {
  @required
  language: String
}

`;
  }
}
