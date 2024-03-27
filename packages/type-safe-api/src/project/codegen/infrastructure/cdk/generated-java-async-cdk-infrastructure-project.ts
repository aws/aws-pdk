/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedJavaCdkInfrastructureBaseProject,
  GeneratedJavaCdkInfrastructureBaseProjectOptions,
} from "./generated-java-cdk-infrastructure-base-project";
import {
  GenerationOptions,
  OtherGenerators,
  getHandlersProjectVendorExtensions,
} from "../../components/utils";

export interface GeneratedJavaAsyncCdkInfrastructureProjectOptions
  extends GeneratedJavaCdkInfrastructureBaseProjectOptions {}

export class GeneratedJavaAsyncCdkInfrastructureProject extends GeneratedJavaCdkInfrastructureBaseProject {
  constructor(options: GeneratedJavaAsyncCdkInfrastructureProjectOptions) {
    super(options);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "java",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.JAVA_ASYNC_CDK_INFRASTRUCTURE,
      srcDir: this.srcDir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-infrastructure-package": this.packageName,
        "x-runtime-package": this.options.generatedJavaTypes.packageName,
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
      // Do not generate map/list types. Generator will use built in HashMap, ArrayList instead
      generateAliasAsModel: false,
    };
  }
}
