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
import { ClientLanguage } from "./languages";

/**
 * Options common to all open api gateway projects
 */
export interface OpenApiGatewayProjectOptions {
  /**
   * The list of languages for which clients will be generated. A typescript client will always be generated.
   */
  readonly clientLanguages: ClientLanguage[];
  /**
   * The directory in which generated client code will be generated, relative to the outdir of this project
   * @default "generated"
   */
  readonly generatedCodeDir?: string;
  /**
   * The path to the OpenAPI specification file, relative to the project source directory (srcdir).
   * @default "spec/spec.yaml"
   */
  readonly specFile?: string;
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
