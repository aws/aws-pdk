/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptHandlersBaseProject,
  GeneratedTypescriptHandlersBaseProjectOptions,
} from "./generated-typescript-handlers-base-project";
import { CodegenOptions, OtherGenerators } from "../components/utils";

export interface GeneratedTypescriptHandlersProjectOptions
  extends GeneratedTypescriptHandlersBaseProjectOptions {}

export class GeneratedTypescriptHandlersProject extends GeneratedTypescriptHandlersBaseProject {
  constructor(options: GeneratedTypescriptHandlersProjectOptions) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.TYPESCRIPT_LAMBDA_HANDLERS],
      metadata: {
        srcDir: this.srcdir,
        tstDir: this.testdir,
        runtimePackageName:
          this.options.generatedTypescriptTypes.package.packageName,
      },
    };
  }
}
