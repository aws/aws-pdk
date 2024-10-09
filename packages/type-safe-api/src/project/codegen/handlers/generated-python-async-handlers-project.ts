/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedPythonHandlersBaseProject,
  GeneratedPythonHandlersBaseProjectOptions,
} from "./generated-python-handlers-base-project";
import { CodegenOptions, OtherGenerators } from "../components/utils";

export interface GeneratedPythonAsyncHandlersProjectOptions
  extends GeneratedPythonHandlersBaseProjectOptions {}

export class GeneratedPythonAsyncHandlersProject extends GeneratedPythonHandlersBaseProject {
  constructor(options: GeneratedPythonAsyncHandlersProjectOptions) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.PYTHON_ASYNC_LAMBDA_HANDLERS],
      metadata: {
        srcDir: this.moduleName,
        tstDir: this.tstDir,
        runtimeModuleName: this.options.generatedPythonTypes.moduleName,
        moduleName: this.moduleName,
      },
    };
  }
}
