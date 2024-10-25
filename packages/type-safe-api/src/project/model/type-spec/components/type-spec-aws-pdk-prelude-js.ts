/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, FileBase, IResolver } from "projen";

/**
 * Options for the aws-pdk/prelude.js file
 */
export interface TypeSpecAwsPdkPreludeJsOptions {
  /**
   * Path to the generated model directory in which to add the prelude
   */
  readonly generatedModelDir: string;
}

/**
 * Synthesize the aws-pdk/prelude.js file
 */
export class TypeSpecAwsPdkPreludeJs extends FileBase {
  constructor(project: Project, options: TypeSpecAwsPdkPreludeJsOptions) {
    super(
      project,
      path.join(options.generatedModelDir, "aws-pdk", "prelude.js"),
      {
        marker: true,
        readonly: true,
      }
    );
  }

  public synthesizeContent(_: IResolver): string | undefined {
    // Define the implementation for the @handler decorator. This reuses the @extension decorator
    // for adding an OpenAPI extension, but abstracts the `x-handler` key.
    return `// ${this.marker}
import { $extension } from "@typespec/openapi";

export function $handler(context, target, value) {
  $extension(context, target, "x-handler", value);
}
`;
  }
}
