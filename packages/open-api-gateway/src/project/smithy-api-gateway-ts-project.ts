/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
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
  /**
   * The directory in which the smithy model files reside
   */
  public readonly modelDir: string = "model";

  constructor(options: SmithyApiGatewayTsProjectOptions) {
    super(options as OpenApiGatewayTsProjectOptions);
  }

  protected preConstruct(
    options: OpenApiGatewayTsProjectOptions
  ): OpenApiGatewayTsProjectOptions {
    const { modelDir, generatedSpecFilePath } = setupSmithyBuild(
      this,
      options as SmithyApiGatewayProjectOptions
    );

    // @ts-ignore this method is called by the constructor
    this.modelDir = modelDir;
    return {
      ...options,
      specFile: generatedSpecFilePath,
    };
  }
}
