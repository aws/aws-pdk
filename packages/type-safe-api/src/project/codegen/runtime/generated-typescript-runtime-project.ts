/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptRuntimeBaseProject,
  GeneratedTypescriptRuntimeBaseProjectOptions,
} from "./generated-typescript-runtime-base-project";
import { Language } from "../../languages";
import { CodegenOptions } from "../components/utils";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptTypesProjectOptions
  extends GeneratedTypescriptRuntimeBaseProjectOptions {}

/**
 * Typescript project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedTypescriptRuntimeProject extends GeneratedTypescriptRuntimeBaseProject {
  constructor(options: GeneratedTypescriptTypesProjectOptions) {
    super(options);
  }

  protected buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [Language.TYPESCRIPT],
      metadata: {
        srcDir: this.srcdir,
      },
    };
  }
}
