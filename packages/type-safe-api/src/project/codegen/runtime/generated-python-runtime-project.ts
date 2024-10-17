/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedPythonRuntimeBaseProject,
  GeneratedPythonRuntimeBaseProjectOptions,
} from "./generated-python-runtime-base-project";
import { Language } from "../../languages";
import { CodegenOptions } from "../components/utils";

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

  protected buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [Language.PYTHON],
      metadata: {
        srcDir: this.moduleName,
        moduleName: this.moduleName,
        projectName: this.name,
      },
    };
  }
}
