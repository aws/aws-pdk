/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { JavaProject } from "projen/lib/java";
import { PDKInternalProject } from "./internal-project";
import { DEFAULT_SMITHY_VERSION } from "../../../packages/type-safe-api/src/project/model/smithy/version";

/**
 * An internal project for the Smithy model transformer used for WebSocket API models.
 */
export class SmithyAsyncTransformerProject
  extends JavaProject
  implements PDKInternalProject
{
  public static NAME = "smithy-async-transformer";

  __internal = true as const;

  constructor(parent: Project) {
    super({
      parent,
      outdir: "internal/smithy-async-transformer",
      groupId: "software.aws.pdk",
      artifactId: "smithy-async-transformer",
      name: SmithyAsyncTransformerProject.NAME,
      version: "0.0.1",
      deps: [
        `software.amazon.smithy/smithy-build@${DEFAULT_SMITHY_VERSION}`,
        `software.amazon.smithy/smithy-model@${DEFAULT_SMITHY_VERSION}`,
        `software.amazon.smithy/smithy-aws-traits@${DEFAULT_SMITHY_VERSION}`,
      ],
      sample: false,
      sampleJavaPackage: "software.aws.pdk",
    });
  }
}
