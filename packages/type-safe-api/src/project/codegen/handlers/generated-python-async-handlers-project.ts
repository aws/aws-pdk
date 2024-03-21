/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedPythonHandlersBaseProject,
  GeneratedPythonHandlersBaseProjectOptions,
} from "./generated-python-handlers-base-project";
import { GenerationOptions, OtherGenerators } from "../components/utils";

export interface GeneratedPythonAsyncHandlersProjectOptions
  extends GeneratedPythonHandlersBaseProjectOptions {}

export class GeneratedPythonAsyncHandlersProject extends GeneratedPythonHandlersBaseProject {
  constructor(options: GeneratedPythonAsyncHandlersProjectOptions) {
    super(options);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "python-nextgen",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.PYTHON_ASYNC_LAMBDA_HANDLERS,
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      tstDir: this.tstDir,
      additionalProperties: {
        packageName: this.moduleName,
        projectName: this.name,
      },
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-module-name": this.options.generatedPythonTypes.moduleName,
      },
    };
  }
}
