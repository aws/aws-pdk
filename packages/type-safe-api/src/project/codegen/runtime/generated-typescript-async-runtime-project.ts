/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptRuntimeBaseProject,
  GeneratedTypescriptRuntimeBaseProjectOptions,
} from "./generated-typescript-runtime-base-project";
import { Language } from "../../languages";
import { CodegenOptions, OtherGenerators } from "../components/utils";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptAsyncRuntimeProjectOptions
  extends GeneratedTypescriptRuntimeBaseProjectOptions {}

/**
 * Typescript project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedTypescriptAsyncRuntimeProject extends GeneratedTypescriptRuntimeBaseProject {
  constructor(options: GeneratedTypescriptAsyncRuntimeProjectOptions) {
    super(options);

    this.addDeps("@aws-sdk/client-apigatewaymanagementapi");
  }

  protected buildCodegenOptions(): CodegenOptions {
    // TODO: not currently used, adjust these when removing openapi generator for websocket apis
    return {
      specPath: this.options.specPath,
      templateDirs: [
        OtherGenerators.TYPESCRIPT_ASYNC_RUNTIME,
        `${Language.TYPESCRIPT}/templates/client/models`,
      ],
      metadata: {
        srcDir: this.srcdir,
      },
    };
  }
}
