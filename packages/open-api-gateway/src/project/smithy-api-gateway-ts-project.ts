/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeScriptProjectOptions } from "projen/lib/typescript";
import {
  OpenApiGatewayTsProject,
  OpenApiGatewayTsProjectOptions,
} from "./open-api-gateway-ts-project";
import { setupSmithyBuild } from "./smithy/setup-smithy-build";
import { SmithyApiGatewayProjectOptions } from "./types";

/**
 * Configuration for the SmithyApiGatewayTsProject
 */
export interface SmithyApiGatewayTsProjectOptions
  extends TypeScriptProjectOptions,
    SmithyApiGatewayProjectOptions {}

/**
 * Synthesizes a Typescript Project with a Smithy model, generated clients, a CDK construct for deploying the API
 * with API Gateway, and generated lambda handler wrappers for type-safe handling of requests.
 *
 * @pjid smithy-api-gateway-ts
 */
export class SmithyApiGatewayTsProject extends OpenApiGatewayTsProject {
  constructor(options: SmithyApiGatewayTsProjectOptions) {
    super(options as OpenApiGatewayTsProjectOptions);
  }

  protected preConstruct(
    options: OpenApiGatewayTsProjectOptions
  ): OpenApiGatewayTsProjectOptions {
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
