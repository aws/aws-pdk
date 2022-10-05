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
 */
export class SmithyApiGatewayJavaProject extends OpenApiGatewayJavaProject {
  /**
   * The directory in which the smithy model files reside
   */
  public readonly modelDir: string = "model";

  constructor(options: SmithyApiGatewayJavaProjectOptions) {
    super(options as OpenApiGatewayJavaProjectOptions);
  }

  protected preConstruct(
    options: OpenApiGatewayJavaProjectOptions
  ): OpenApiGatewayJavaProjectOptions {
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
