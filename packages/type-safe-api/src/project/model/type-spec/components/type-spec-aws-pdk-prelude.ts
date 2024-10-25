/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, FileBase, IResolver } from "projen";
import { Language } from "../../../languages";

/**
 * Options for the aws-pdk/prelude.tsp file
 */
export interface TypeSpecAwsPdkPreludeOptions {
  /**
   * Path to the generated model directory in which to add the prelude
   */
  readonly generatedModelDir: string;
  /**
   * Languages selected for handlers
   */
  readonly handlerLanguages?: Language[];
}

/**
 * Synthesize the aws-pdk/prelude.tsp file
 */
export class TypeSpecAwsPdkPrelude extends FileBase {
  private readonly options: TypeSpecAwsPdkPreludeOptions;

  constructor(project: Project, options: TypeSpecAwsPdkPreludeOptions) {
    super(
      project,
      path.join(options.generatedModelDir, "aws-pdk", "prelude.tsp"),
      {
        marker: true,
        readonly: true,
      }
    );
    this.options = options;
  }

  public synthesizeContent(_: IResolver): string | undefined {
    const hasAnyHandlerProjects =
      (this.options.handlerLanguages ?? []).length > 0;

    // If there are handler languages, we define the @handler decorator.
    // The decorator implementation is defined in the prelude.js file.
    return `// ${this.marker}
import "./prelude.js";

using TypeSpec.Reflection;

${
  hasAnyHandlerProjects
    ? `model HandlerOptions {
  language: ${this.options.handlerLanguages!.map((l) => `"${l}"`).join(" | ")};
}

extern dec handler(target: Operation, options: HandlerOptions);`
    : ""
}
`;
  }
}
