/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedPythonRuntimeBaseProject,
  GeneratedPythonRuntimeBaseProjectOptions,
} from "./generated-python-runtime-base-project";
import { Language } from "../../languages";
import { GenerationOptions } from "../components/utils";

/**
 * Configuration for the generated python types project
 */
export interface GeneratedPythonTypesProjectOptions
  extends GeneratedPythonRuntimeBaseProjectOptions {}

/**
 * Python project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedPythonRuntimeProject extends GeneratedPythonRuntimeBaseProject {
  constructor(options: GeneratedPythonTypesProjectOptions) {
    super(options);
  }

  protected buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "python",
      specPath: this.options.specPath,
      generatorDirectory: Language.PYTHON,
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
