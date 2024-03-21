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
  GenerationOptions,
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

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.TYPESCRIPT_CDK_INFRASTRUCTURE,
      srcDir: this.srcdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-package-name":
          this.options.generatedTypescriptTypes.package.packageName,
        // Spec path relative to the source directory
        "x-relative-spec-path": path.join("..", this.packagedSpecPath),
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
