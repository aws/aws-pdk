/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, SampleDir } from "projen";

/**
 * Options for Smithy shape library sample code
 */
export interface SmithyShapeLibrarySampleCodeOptions {
  /**
   * Directory in which the smithy sample code should be written
   */
  readonly modelDir: string;
  /**
   * Namespace
   */
  readonly namespace: string;
}

/**
 * Defines sample code for a Smithy shape library
 */
export class SmithyShapeLibrarySampleCode extends SampleDir {
  constructor(
    project: Project,
    { modelDir, namespace }: SmithyShapeLibrarySampleCodeOptions
  ) {
    super(project, modelDir, {
      files: {
        "example.smithy": `$version: "2"
namespace ${namespace}

/// An example structure
structure Example {
    @required
    myProperty: String
}
`,
      },
    });
  }
}
