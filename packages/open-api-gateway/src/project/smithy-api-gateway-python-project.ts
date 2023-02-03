/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { PythonProjectOptions } from "projen/lib/python";
import {
  OpenApiGatewayPythonProject,
  OpenApiGatewayPythonProjectOptions,
} from "./open-api-gateway-python-project";
import { setupSmithyBuild } from "./smithy/setup-smithy-build";
import { SmithyApiGatewayProjectOptions } from "./types";

/**
 * Configuration for the SmithyApiGatewayPythonProject
 */
export interface SmithyApiGatewayPythonProjectOptions
  extends PythonProjectOptions,
    SmithyApiGatewayProjectOptions {}

/**
 * Synthesizes a Python Project with a Smithy model, generated clients, a CDK construct for deploying the API
 * with API Gateway, and generated lambda handler wrappers for type-safe handling of requests.
 *
 * @pjid smithy-api-gateway-py
 */
export class SmithyApiGatewayPythonProject extends OpenApiGatewayPythonProject {
  /**
   * The directory in which the smithy model files reside
   */
  public readonly modelDir: string = "model";

  constructor(options: SmithyApiGatewayPythonProjectOptions) {
    super(options as OpenApiGatewayPythonProjectOptions);
  }

  protected preConstruct(
    options: OpenApiGatewayPythonProjectOptions
  ): OpenApiGatewayPythonProjectOptions {
    const { modelDir, generatedSpecFilePath } = setupSmithyBuild(
      this,
      // Options are the same as those in the constructor, so it is safe to cast to SmithyApiGatewayProjectOptions
      options as unknown as SmithyApiGatewayProjectOptions
    );

    // @ts-ignore this method is called by the constructor
    this.modelDir = modelDir;
    return {
      ...options,
      specFile: generatedSpecFilePath,
    };
  }
}
