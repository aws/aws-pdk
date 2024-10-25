/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, FileBase, IResolver } from "projen";

/**
 * Options for the aws-pdk/async.js file
 */
export interface TypeSpecAsyncAwsPdkPreludeJsOptions {
  /**
   * Path to the generated model directory in which to add the prelude
   */
  readonly generatedModelDir: string;
}

/**
 * Synthesize the aws-pdk/async.js file
 */
export class TypeSpecAsyncAwsPdkPreludeJs extends FileBase {
  constructor(project: Project, options: TypeSpecAsyncAwsPdkPreludeJsOptions) {
    super(
      project,
      path.join(options.generatedModelDir, "aws-pdk", "async.js"),
      {
        marker: true,
        readonly: true,
      }
    );
  }

  public synthesizeContent(_: IResolver): string | undefined {
    // Define the @async, @connectHandler and @disconnectHandler decorator implementations.
    // The @async decorator implementation adds the "x-async" vendor extension to the operation in
    // the OpenAPI spec, as well as setting the method to POST and path to /<OperationID>.
    return `// ${this.marker}
import { $extension } from "@typespec/openapi";
import { $post, $route } from "@typespec/http";

export function $async(context, target, value) {
  $post(context, target);
  $route(context, target, \`/\${target.name}\`);
  $extension(context, target, "x-async", value);
}

export function $connectHandler(context, target, value) {
  $extension(context, target, "x-connect-handler", value);
}

export function $disconnectHandler(context, target, value) {
  $extension(context, target, "x-disconnect-handler", value);
}
`;
  }
}
