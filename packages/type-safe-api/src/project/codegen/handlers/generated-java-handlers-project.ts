/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedJavaHandlersBaseProject,
  GeneratedJavaHandlersBaseProjectOptions,
} from "./generated-java-handlers-base-project";
import { GenerationOptions, OtherGenerators } from "../components/utils";

export interface GeneratedJavaHandlersProjectOptions
  extends GeneratedJavaHandlersBaseProjectOptions {}

export class GeneratedJavaHandlersProject extends GeneratedJavaHandlersBaseProject {
  constructor(options: GeneratedJavaHandlersProjectOptions) {
    super(options);
  }

  public buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "java",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.JAVA_LAMBDA_HANDLERS,
      srcDir: this.srcDir,
      tstDir: this.tstDir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-handlers-package": this.packageName,
        "x-runtime-package": this.options.generatedJavaTypes.packageName,
      },
      // Do not generate map/list types. Generator will use built in HashMap, ArrayList instead
      generateAliasAsModel: false,
    };
  }
}
