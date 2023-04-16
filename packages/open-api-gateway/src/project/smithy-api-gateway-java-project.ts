/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { JavaProjectOptions } from "projen/lib/java";
import {
  OpenApiGatewayJavaProject,
  OpenApiGatewayJavaProjectOptions,
} from "./open-api-gateway-java-project";
import { setupSmithyBuild } from "./smithy/setup-smithy-build";
import { SmithyApiGatewayProjectOptions } from "./types";

/**
 * Configuration for the SmithyApiGatewayJavaProject
 */
export interface SmithyApiGatewayJavaProjectOptions
  extends JavaProjectOptions,
    SmithyApiGatewayProjectOptions {}

/**
 * Synthesizes a Java Project with a Smithy model, generated clients, a CDK construct for deploying the API
 * with API Gateway, and generated lambda handler wrappers for type-safe handling of requests.
 *
 * @pjid smithy-api-gateway-java
 * @deprecated Please use TypeSafeApiProject instead. This will be removed in the PDK GA 1.0 release.
 */
export class SmithyApiGatewayJavaProject extends OpenApiGatewayJavaProject {
  constructor(options: SmithyApiGatewayJavaProjectOptions) {
    super(options as OpenApiGatewayJavaProjectOptions);
  }

  protected preConstruct(
    options: OpenApiGatewayJavaProjectOptions
  ): OpenApiGatewayJavaProjectOptions {
    const { generatedSpecFilePath } = setupSmithyBuild(
      this,
      // Options are the same as those in the constructor, so it is safe to cast to SmithyApiGatewayProjectOptions
      options as unknown as SmithyApiGatewayProjectOptions
    );

    return {
      ...options,
      specFile: generatedSpecFilePath,
    };
  }
}
