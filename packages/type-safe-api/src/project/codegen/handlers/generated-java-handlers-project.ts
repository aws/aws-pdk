/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedJavaHandlersBaseProject,
  GeneratedJavaHandlersBaseProjectOptions,
} from "./generated-java-handlers-base-project";
import { CodegenOptions, OtherGenerators } from "../components/utils";

export interface GeneratedJavaHandlersProjectOptions
  extends GeneratedJavaHandlersBaseProjectOptions {}

export class GeneratedJavaHandlersProject extends GeneratedJavaHandlersBaseProject {
  constructor(options: GeneratedJavaHandlersProjectOptions) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.JAVA_LAMBDA_HANDLERS],
      metadata: {
        srcDir: this.srcDir,
        tstDir: this.tstDir,
        packageName: this.packageName,
        runtimePackageName: this.options.generatedJavaTypes.packageName,
      },
    };
  }
}
