/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedPythonCdkInfrastructureBaseProject,
  GeneratedPythonCdkInfrastructureBaseProjectOptions,
} from "./generated-python-cdk-infrastructure-base-project";
import {
  GenerationOptions,
  OtherGenerators,
  getHandlersProjectVendorExtensions,
} from "../../components/utils";

export interface GeneratedPythonAsyncCdkInfrastructureProjectOptions
  extends GeneratedPythonCdkInfrastructureBaseProjectOptions {}

export class GeneratedPythonAsyncCdkInfrastructureProject extends GeneratedPythonCdkInfrastructureBaseProject {
  constructor(options: GeneratedPythonAsyncCdkInfrastructureProjectOptions) {
    super(options);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "python-nextgen",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.PYTHON_ASYNC_CDK_INFRASTRUCTURE,
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-module-name": this.options.generatedPythonTypes.moduleName,
        // Spec path relative to the source directory
        "x-relative-spec-path": path.join("..", this.options.specPath),
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }
}
