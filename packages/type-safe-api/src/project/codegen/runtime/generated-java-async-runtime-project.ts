/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  GeneratedJavaRuntimeBaseProject,
  GeneratedJavaRuntimeBaseProjectOptions,
} from "./generated-java-runtime-base-project";
import { GenerationOptions, OtherGenerators } from "../components/utils";

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

  protected buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "java",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.JAVA_ASYNC_RUNTIME,
      additionalProperties: {
        useSingleRequestParameter: "true",
        groupId: this.pom.groupId,
        artifactId: this.pom.artifactId,
        artifactVersion: this.pom.version,
        invokerPackage: this.packageName,
        apiPackage: `${this.packageName}.api`,
        modelPackage: `${this.packageName}.model`,
        hideGenerationTimestamp: "true",
        additionalModelTypeAnnotations: [
          "@lombok.AllArgsConstructor",
          // Regular lombok builder is not used since an abstract base schema class is also annotated
          "@lombok.experimental.SuperBuilder",
        ].join("\\ "),
      },
      srcDir: path.join("src", "main", "java", ...this.packageName.split(".")),
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      // Do not generate map/list types. Generator will use built in HashMap, ArrayList instead
      generateAliasAsModel: false,
    };
  }
}
