/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedPythonRuntimeBaseProject,
  GeneratedPythonRuntimeBaseProjectOptions,
} from "./generated-python-runtime-base-project";
import { GenerationOptions, OtherGenerators } from "../components/utils";

/**
 * Configuration for the generated python types project
 */
export interface GeneratedPythonAsyncRuntimeProjectOptions
  extends GeneratedPythonRuntimeBaseProjectOptions {}

/**
 * Python project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedPythonAsyncRuntimeProject extends GeneratedPythonRuntimeBaseProject {
  constructor(options: GeneratedPythonAsyncRuntimeProjectOptions) {
    super(options);
  }

  protected buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "python",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.PYTHON_ASYNC_RUNTIME,
      additionalProperties: {
        packageName: this.moduleName,
        projectName: this.name,
      },
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
    };
  }
}
