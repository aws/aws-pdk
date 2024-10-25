/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, FileBase, IResolver } from "projen";

/**
 * Options for the aws-pdk/async.tsp file
 */
export interface TypeSpecAsyncAwsPdkPreludeOptions {
  /**
   * Path to the generated model directory in which to add the prelude
   */
  readonly generatedModelDir: string;
}

/**
 * Synthesize the aws-pdk/async.tsp file
 */
export class TypeSpecAsyncAwsPdkPrelude extends FileBase {
  constructor(project: Project, options: TypeSpecAsyncAwsPdkPreludeOptions) {
    super(
      project,
      path.join(options.generatedModelDir, "aws-pdk", "async.tsp"),
      {
        marker: true,
        readonly: true,
      }
    );
  }

  public synthesizeContent(_: IResolver): string | undefined {
    // Define the @async, @connectHandler and @disconnectHandler decorators
    // The implementation of these is imported from the async.js file.
    return `// ${this.marker}
import "./prelude.tsp";
import "./async.js";

using TypeSpec.Reflection;

model AsyncOptions {
  direction: "client_to_server" | "server_to_client" | "bidirectional";
}

extern dec async(target: Operation, options: AsyncOptions);

extern dec connectHandler(target: Namespace, options: HandlerOptions);
extern dec disconnectHandler(target: Namespace, options: HandlerOptions);
`;
  }
}
