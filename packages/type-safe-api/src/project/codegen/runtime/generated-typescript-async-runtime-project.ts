/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  GeneratedTypescriptRuntimeBaseProject,
  GeneratedTypescriptRuntimeBaseProjectOptions,
} from "./generated-typescript-runtime-base-project";
import { GenerationOptions, OtherGenerators } from "../components/utils";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptAsyncRuntimeProjectOptions
  extends GeneratedTypescriptRuntimeBaseProjectOptions {}

/**
 * Typescript project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedTypescriptAsyncRuntimeProject extends GeneratedTypescriptRuntimeBaseProject {
  constructor(options: GeneratedTypescriptAsyncRuntimeProjectOptions) {
    super(options);

    this.addDeps("@aws-sdk/client-apigatewaymanagementapi");

    this.openapiGeneratorIgnore.addPatterns(
      // Skip generating http clients
      `${this.srcdir}/apis/**/*`,
      `${this.srcdir}/apis/*`
    );
  }

  protected buildOpenApiGeneratorOptions(): GenerationOptions {
    return {
      generator: "typescript-fetch",
      specPath: this.options.specPath,
      generatorDirectory: OtherGenerators.TYPESCRIPT_ASYNC_RUNTIME,
      additionalProperties: {
        npmName: this.package.packageName,
        typescriptThreePlus: "true",
        useSingleParameter: "true",
        supportsES6: "true",
      },
      srcDir: this.srcdir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
    };
  }
}
