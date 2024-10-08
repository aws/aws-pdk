/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedPythonCdkInfrastructureBaseProject,
  GeneratedPythonCdkInfrastructureBaseProjectOptions,
} from "./generated-python-cdk-infrastructure-base-project";
import { MockResponseGenerationOptions } from "../../../types";
import {
  buildInvokeMockDataGeneratorCommand,
  CodegenOptions,
  getHandlersProjectVendorExtensions,
  OtherGenerators,
} from "../../components/utils";

export interface GeneratedPythonCdkInfrastructureProjectOptions
  extends GeneratedPythonCdkInfrastructureBaseProjectOptions,
    MockResponseGenerationOptions {}

export class GeneratedPythonCdkInfrastructureProject extends GeneratedPythonCdkInfrastructureBaseProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedPythonCdkInfrastructureProjectOptions;

  constructor(options: GeneratedPythonCdkInfrastructureProjectOptions) {
    super(options);
    this.options = options;

    if (!this.options.mockDataOptions?.disable) {
      this.generateTask.exec(this.buildGenerateMockDataCommand());
    }
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.PYTHON_CDK_INFRASTRUCTURE],
      metadata: {
        srcDir: this.moduleName,
        runtimeModuleName: this.options.generatedPythonTypes.moduleName,
        relativeSpecPath: path.join("..", this.options.specPath),
        enableMockIntegrations: !this.options.mockDataOptions?.disable,
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }

  public buildGenerateMockDataCommand = () => {
    return buildInvokeMockDataGeneratorCommand({
      specPath: this.options.specPath,
      ...this.options.mockDataOptions,
    });
  };
}
