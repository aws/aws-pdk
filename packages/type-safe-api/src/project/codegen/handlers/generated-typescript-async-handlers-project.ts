/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptHandlersBaseProject,
  GeneratedTypescriptHandlersBaseProjectOptions,
} from "./generated-typescript-handlers-base-project";
import { CodegenOptions, OtherGenerators } from "../components/utils";

export interface GeneratedTypescriptAsyncHandlersProjectOptions
  extends GeneratedTypescriptHandlersBaseProjectOptions {}

export class GeneratedTypescriptAsyncHandlersProject extends GeneratedTypescriptHandlersBaseProject {
  constructor(options: GeneratedTypescriptAsyncHandlersProjectOptions) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.TYPESCRIPT_ASYNC_LAMBDA_HANDLERS],
      metadata: {
        srcDir: this.srcdir,
        tstDir: this.testdir,
        runtimePackageName:
          this.options.generatedTypescriptTypes.package.packageName,
      },
    };
  }
}
