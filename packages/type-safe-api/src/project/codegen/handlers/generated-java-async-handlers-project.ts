/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedJavaHandlersBaseProject,
  GeneratedJavaHandlersBaseProjectOptions,
} from "./generated-java-handlers-base-project";
import { CodegenOptions, OtherGenerators } from "../components/utils";

export interface GeneratedJavaAsyncHandlersProjectOptions
  extends GeneratedJavaHandlersBaseProjectOptions {}

export class GeneratedJavaAsyncHandlersProject extends GeneratedJavaHandlersBaseProject {
  constructor(options: GeneratedJavaAsyncHandlersProjectOptions) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.JAVA_ASYNC_LAMBDA_HANDLERS],
      metadata: {
        srcDir: this.srcDir,
        tstDir: this.tstDir,
        packageName: this.packageName,
        runtimePackageName: this.options.generatedJavaTypes.packageName,
      },
    };
  }
}
