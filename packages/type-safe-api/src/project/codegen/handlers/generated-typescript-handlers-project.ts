/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptHandlersBaseProject,
  GeneratedTypescriptHandlersBaseProjectOptions,
} from "./generated-typescript-handlers-base-project";
import { GenerationOptions, OtherGenerators } from "../components/utils";

export interface GeneratedTypescriptHandlersProjectOptions
  extends GeneratedTypescriptHandlersBaseProjectOptions {}

export class GeneratedTypescriptHandlersProject extends GeneratedTypescriptHandlersBaseProject {
  constructor(options: GeneratedTypescriptHandlersProjectOptions) {
    super(options);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.TYPESCRIPT_LAMBDA_HANDLERS,
      srcDir: this.srcdir,
      tstDir: this.testdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-package-name":
          this.options.generatedTypescriptTypes.package.packageName,
      },
    };
  }
}
