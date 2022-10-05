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
import { PythonProjectOptions } from "projen/lib/python";
import { TypeScriptProjectOptions } from "projen/lib/typescript";
import { ClientLanguage, DocumentationFormat } from "./languages";
import { SmithyBuildOptions } from "./smithy/types";

/**
 * Options common to all open api gateway projects
 */
export interface OpenApiGatewayProjectOptions extends CommonApiProjectOptions {
  /**
   * The path to the OpenAPI specification file, relative to the project source directory (srcdir).
   * @default "spec/spec.yaml"
   */
  readonly specFile?: string;
}

/**
 * Represents a fully qualified name of a Smithy service.
 * @see https://awslabs.github.io/smithy/2.0/spec/service-types.html
 */
export interface SmithyServiceName {
  /**
   * The service namespace. Nested namespaces are separated by '.', for example com.company
   * @see https://awslabs.github.io/smithy/2.0/spec/model.html#shape-id
   */
  readonly namespace: string;
  /**
   * The service name. Should be PascalCase, for example HelloService
   * @see https://awslabs.github.io/smithy/2.0/spec/model.html#shape-id
   */
  readonly serviceName: string;
}

/**
 * Options common to all smithy api gateway projects
 */
export interface SmithyApiGatewayProjectOptions
  extends CommonApiProjectOptions {
  /**
   * The name of the Smithy service from your model which will be targeted for deployment and client generation.
   * On initial project synthesis this service name will be written to the sample "hello world" model. If you change
   * this value after initial synthesis you will need to manually update your Smithy models to match, unless you delete
   * the "model" directory. Likewise, if you change the namespace or service name in your Smithy models you will need to
   * update this value to ensure your service can be found.
   * @default "example.hello#Hello"
   */
  readonly serviceName: SmithyServiceName;
  /**
   * The path to the Smithy model directory, relative to the project source directory (srcdir).
   * @default "model"
   */
  readonly modelDir?: string;
  /**
   * Any additional properties you'd like to add your smithy-build.json. The smithy-build.json will automatically
   * include the "openapi" plugin, but you can add extra configuration for that via this option if you like.
   * @see https://awslabs.github.io/smithy/2.0/guides/building-models/build-config.html
   * @see https://awslabs.github.io/smithy/2.0/guides/converting-to-openapi.html#openapi-configuration-settings
   */
  readonly smithyBuildOptions?: SmithyBuildOptions;
  /**
   * Set to false if you would like to check in your smithy build output or have more fine-grained control over what is
   * checked in, eg if you add other projections to the smithy-build.json file.
   * @default true
   */
  readonly ignoreSmithyBuildOutput?: boolean;
  /**
   * Path to a directory containing a custom gradle wrapper (gradlew) to use instead of the one provided by the PDK,
   * relative to the project outdir.
   * Use this if you would like to own and check in the gradle wrapper instead of using the provided one.
   */
  readonly gradleWrapperPath?: string;
}

export interface CommonApiProjectOptions {
  /**
   * The list of languages for which clients will be generated. A typescript client will always be generated.
   */
  readonly clientLanguages: ClientLanguage[];
  /**
   * Formats to generate documentation in
   */
  readonly documentationFormats?: DocumentationFormat[];
  /**
   * The directory in which generated client code will be generated, relative to the outdir of this project
   * @default "generated"
   */
  readonly generatedCodeDir?: string;
  /**
   * Force to generate code and docs even if there were no changes in spec
   * @default "false"
   */
  readonly forceGenerateCodeAndDocs?: boolean;
  /**
   * The directory in which the api generated code will reside, relative to the project srcdir
   */
  readonly apiSrcDir?: string;
  /**
   * The name of the output parsed OpenAPI specification file. Must end with .json.
   * @default ".parsed-spec.json"
   */
  readonly parsedSpecFileName?: string;
  /**
   * Options for the generated typescript client. These override the default inferred options.
   */
  readonly typescriptClientOptions?: TypeScriptProjectOptions;
  /**
   * Options for the generated python client (if specified in clientLanguages).
   * These override the default inferred options.
   */
  readonly pythonClientOptions?: PythonProjectOptions;
  /**
   * Options for the generated java client (if specified in clientLanguages).
   * These override the default inferred options.
   */
  readonly javaClientOptions?: JavaProjectOptions;
}
