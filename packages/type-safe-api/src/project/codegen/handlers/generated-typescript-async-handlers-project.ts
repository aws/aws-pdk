/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptHandlersBaseProject,
  GeneratedTypescriptHandlersBaseProjectOptions,
} from "./generated-typescript-handlers-base-project";
import { GenerationOptions, OtherGenerators } from "../components/utils";

export interface GeneratedTypescriptAsyncHandlersProjectOptions
  extends GeneratedTypescriptHandlersBaseProjectOptions {}

export class GeneratedTypescriptAsyncHandlersProject extends GeneratedTypescriptHandlersBaseProject {
  constructor(options: GeneratedTypescriptAsyncHandlersProjectOptions) {
    super(options);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.TYPESCRIPT_ASYNC_LAMBDA_HANDLERS,
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
