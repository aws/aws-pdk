/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedTypescriptCdkInfrastructureBaseProject,
  GeneratedTypescriptCdkInfrastructureBaseProjectOptions,
} from "./generated-typescript-cdk-infrastructure-base-project";
import {
  CodegenOptions,
  getHandlersProjectVendorExtensions,
  OtherGenerators,
} from "../../components/utils";

export interface GeneratedTypescriptAsyncCdkInfrastructureProjectOptions
  extends GeneratedTypescriptCdkInfrastructureBaseProjectOptions {}

export class GeneratedTypescriptAsyncCdkInfrastructureProject extends GeneratedTypescriptCdkInfrastructureBaseProject {
  constructor(
    options: GeneratedTypescriptAsyncCdkInfrastructureProjectOptions
  ) {
    super(options);
  }

  public buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [OtherGenerators.TYPESCRIPT_ASYNC_CDK_INFRASTRUCTURE],
      metadata: {
        srcDir: this.srcdir,
        runtimePackageName:
          this.options.generatedTypescriptTypes.package.packageName,
        // Spec path relative to the source directory
        relativeSpecPath: path.join("..", this.packagedSpecPath),
        ...getHandlersProjectVendorExtensions(
          this,
          this.options.generatedHandlers
        ),
      },
    };
  }
}
