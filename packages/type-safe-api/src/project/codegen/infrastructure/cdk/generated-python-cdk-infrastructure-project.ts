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
  GenerationOptions,
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

    this.openapiGeneratorIgnore.addPatterns(
      `!${this.moduleName}/mock_integrations.py`
    );
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "python-nextgen",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.PYTHON_CDK_INFRASTRUCTURE,
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-module-name": this.options.generatedPythonTypes.moduleName,
        // Spec path relative to the source directory
        "x-relative-spec-path": path.join("..", this.options.specPath),
        // Enable mock integration generation by default
        "x-enable-mock-integrations": !this.options.mockDataOptions?.disable,
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
