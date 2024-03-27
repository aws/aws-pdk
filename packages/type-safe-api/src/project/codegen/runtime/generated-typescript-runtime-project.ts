/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptRuntimeBaseProject,
  GeneratedTypescriptRuntimeBaseProjectOptions,
} from "./generated-typescript-runtime-base-project";
import { Language } from "../../languages";
import { GenerationOptions } from "../components/utils";

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

  protected buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: Language.TYPESCRIPT,
      additionalProperties: {
        npmName: this.package.packageName,
        typescriptThreePlus: "true",
        useSingleParameter: "true",
        supportsES6: "true",
      },
      srcDir: this.srcdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
    };
  }
}
