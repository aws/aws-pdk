/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedJavaRuntimeBaseProject,
  GeneratedJavaRuntimeBaseProjectOptions,
} from "./generated-java-runtime-base-project";
import { Language } from "../../languages";
import { CodegenOptions } from "../components/utils";

/**
 * Configuration for the generated java runtime project
 */
export interface GeneratedJavaAsyncRuntimeProjectOptions
  extends GeneratedJavaRuntimeBaseProjectOptions {}

/**
 * Java project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedJavaAsyncRuntimeProject extends GeneratedJavaRuntimeBaseProject {
  constructor(options: GeneratedJavaAsyncRuntimeProjectOptions) {
    super(options);
  }

  protected buildCodegenOptions(): CodegenOptions {
    return {
      specPath: this.options.specPath,
      templateDirs: [
        // TODO: when implemented, swap to OtherGenerators.JAVA_ASYNC_RUNTIME and "java/templates/client/models"
        Language.JAVA,
      ],
      metadata: {
        groupId: this.pom.groupId,
        artifactId: this.pom.artifactId,
        artifactVersion: this.pom.version,
        packageName: this.packageName,
        srcDir: path.join(
          "src",
          "main",
          "java",
          ...this.packageName.split(".")
        ),
      },
    };
  }
}
