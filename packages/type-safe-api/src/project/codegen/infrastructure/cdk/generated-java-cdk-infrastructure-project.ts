/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedJavaCdkInfrastructureBaseProject,
  GeneratedJavaCdkInfrastructureBaseProjectOptions,
} from "./generated-java-cdk-infrastructure-base-project";
import { MockResponseGenerationOptions } from "../../../types";
import {
  buildInvokeMockDataGeneratorCommand,
  CodegenOptions,
  getHandlersProjectVendorExtensions,
  OtherGenerators,
} from "../../components/utils";

export interface GeneratedJavaCdkInfrastructureProjectOptions
  extends GeneratedJavaCdkInfrastructureBaseProjectOptions,
    MockResponseGenerationOptions {}

export class GeneratedJavaCdkInfrastructureProject extends GeneratedJavaCdkInfrastructureBaseProject {
  protected readonly options: GeneratedJavaCdkInfrastructureProjectOptions;

  constructor(options: GeneratedJavaCdkInfrastructureProjectOptions) {
    super(options);
    this.options = options;

    if (!this.options.mockDataOptions?.disable) {
      this.generateTask.exec(this.buildGenerateMockDataCommand());
    }
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.JAVA_CDK_INFRASTRUCTURE],
      metadata: {
        srcDir: this.srcDir,
        packageName: this.packageName,
        runtimePackageName: this.options.generatedJavaTypes.packageName,
        enableMockIntegrations: !this.options.mockDataOptions?.disable,
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }

  public buildGenerateMockDataCommand = (): string => {
    return buildInvokeMockDataGeneratorCommand({
      specPath: this.options.specPath,
      // Write the mocks to the resources directory
      outputSubDir: "src/main/resources",
      ...this.options.mockDataOptions,
    });
  };
}
