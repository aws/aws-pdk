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
import * as path from "path";
import { exec } from "projen/lib/util";
import { ClientLanguage } from "../../languages";

/**
 * Options for generating the client code
 */
export interface GenerateClientCodeOptions {
  /**
   * The OpenAPI generator to use to generate the code
   */
  readonly generator: string;
  /**
   * The language to generate the client in
   */
  readonly language: ClientLanguage;
  /**
   * The path of the OpenAPI spec to generate the client for
   */
  readonly specPath: string;
  /**
   * The directory in which the generated code should be output
   */
  readonly outputPath: string;
  /**
   * Additional properties to pass to the generate cli
   */
  readonly additionalProperties?: {
    [key: string]: string;
  };
}

const serializeProperties = (properties: { [key: string]: string }) =>
  Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");

/**
 * Generate client code by invoking the root generate script
 */
export const generateClientCode = (options: GenerateClientCodeOptions) => {
  const additionalProperties = options.additionalProperties
    ? ` --additional-properties ${serializeProperties(
        options.additionalProperties
      )}`
    : "";
  exec(
    `./generate --generator ${options.generator} --spec-path ${options.specPath} --output-path ${options.outputPath} --language ${options.language}${additionalProperties}`,
    {
      cwd: path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "scripts",
        "generators"
      ),
    }
  );
};
