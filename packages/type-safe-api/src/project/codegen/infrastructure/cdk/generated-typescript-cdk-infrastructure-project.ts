/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedTypescriptCdkInfrastructureBaseProject,
  GeneratedTypescriptCdkInfrastructureBaseProjectOptions,
} from "./generated-typescript-cdk-infrastructure-base-project";
import { MockResponseGenerationOptions } from "../../../types";
import {
  buildInvokeMockDataGeneratorCommand,
  CodegenOptions,
  getHandlersProjectVendorExtensions,
  OtherGenerators,
} from "../../components/utils";

export interface GeneratedTypescriptCdkInfrastructureProjectOptions
  extends GeneratedTypescriptCdkInfrastructureBaseProjectOptions,
    MockResponseGenerationOptions {}

export class GeneratedTypescriptCdkInfrastructureProject extends GeneratedTypescriptCdkInfrastructureBaseProject {
  /**
   * Options configured for the project
   * @private
   */
  protected readonly options: GeneratedTypescriptCdkInfrastructureProjectOptions;

  constructor(options: GeneratedTypescriptCdkInfrastructureProjectOptions) {
    super(options);
    this.options = options;

    if (!this.options.mockDataOptions?.disable) {
      this.generateTask.exec(this.buildGenerateMockDataCommand());
    }
  }

  protected buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.TYPESCRIPT_CDK_INFRASTRUCTURE],
      metadata: {
        srcDir: this.srcdir,
        runtimePackageName:
          this.options.generatedTypescriptTypes.package.packageName,
        // Spec path relative to the source directory
        relativeSpecPath: path.join("..", this.packagedSpecPath),
        // Enable mock integration generation by default
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
