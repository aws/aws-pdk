/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedPythonCdkInfrastructureBaseProject,
  GeneratedPythonCdkInfrastructureBaseProjectOptions,
} from "./generated-python-cdk-infrastructure-base-project";
import {
  CodegenOptions,
  OtherGenerators,
  getHandlersProjectVendorExtensions,
} from "../../components/utils";

export interface GeneratedPythonAsyncCdkInfrastructureProjectOptions
  extends GeneratedPythonCdkInfrastructureBaseProjectOptions {}

export class GeneratedPythonAsyncCdkInfrastructureProject extends GeneratedPythonCdkInfrastructureBaseProject {
  constructor(options: GeneratedPythonAsyncCdkInfrastructureProjectOptions) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.PYTHON_ASYNC_CDK_INFRASTRUCTURE],
      metadata: {
        srcDir: this.moduleName,
        runtimeModuleName: this.options.generatedPythonTypes.moduleName,
        relativeSpecPath: path.join("..", this.options.specPath),
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }
}
