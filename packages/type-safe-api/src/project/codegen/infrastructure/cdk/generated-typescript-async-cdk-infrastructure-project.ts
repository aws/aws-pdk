/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedTypescriptCdkInfrastructureBaseProject,
  GeneratedTypescriptCdkInfrastructureBaseProjectOptions,
} from "./generated-typescript-cdk-infrastructure-base-project";
import {
  GenerationOptions,
  OtherGenerators,
  getHandlersProjectVendorExtensions,
} from "../../components/utils";

export interface GeneratedTypescriptAsyncCdkInfrastructureProjectOptions
  extends GeneratedTypescriptCdkInfrastructureBaseProjectOptions {}

export class GeneratedTypescriptAsyncCdkInfrastructureProject extends GeneratedTypescriptCdkInfrastructureBaseProject {
  constructor(
    options: GeneratedTypescriptAsyncCdkInfrastructureProjectOptions
  ) {
    super(options);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.TYPESCRIPT_ASYNC_CDK_INFRASTRUCTURE,
      srcDir: this.srcdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-runtime-package-name":
          this.options.generatedTypescriptTypes.package.packageName,
        // Spec path relative to the source directory
        "x-relative-spec-path": path.join("..", this.packagedSpecPath),
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }
}
