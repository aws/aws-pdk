/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedJavaCdkInfrastructureBaseProject,
  GeneratedJavaCdkInfrastructureBaseProjectOptions,
} from "./generated-java-cdk-infrastructure-base-project";
import { MockResponseGenerationOptions } from "../../../types";
import {
  buildInvokeMockDataGeneratorCommand,
  GenerationOptions,
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

    this.openapiGeneratorIgnore.addPatterns(
      `!${this.srcDir}/MockIntegrations.java`
    );
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "java",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.JAVA_CDK_INFRASTRUCTURE,
      srcDir: this.srcDir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-infrastructure-package": this.packageName,
        "x-runtime-package": this.options.generatedJavaTypes.packageName,
        // Enable mock integration generation by default
        "x-enable-mock-integrations": !this.options.mockDataOptions?.disable,
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
      // Do not generate map/list types. Generator will use built in HashMap, ArrayList instead
      generateAliasAsModel: false,
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
