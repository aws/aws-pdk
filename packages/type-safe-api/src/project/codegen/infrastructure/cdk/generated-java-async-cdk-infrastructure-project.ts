/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedJavaCdkInfrastructureBaseProject,
  GeneratedJavaCdkInfrastructureBaseProjectOptions,
} from "./generated-java-cdk-infrastructure-base-project";
import {
  CodegenOptions,
  OtherGenerators,
  getHandlersProjectVendorExtensions,
} from "../../components/utils";

export interface GeneratedJavaAsyncCdkInfrastructureProjectOptions
  extends GeneratedJavaCdkInfrastructureBaseProjectOptions {}

export class GeneratedJavaAsyncCdkInfrastructureProject extends GeneratedJavaCdkInfrastructureBaseProject {
  constructor(options: GeneratedJavaAsyncCdkInfrastructureProjectOptions) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.JAVA_ASYNC_CDK_INFRASTRUCTURE],
      metadata: {
        srcDir: this.srcDir,
        packageName: this.packageName,
        runtimePackageName: this.options.generatedJavaTypes.packageName,
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }
}
