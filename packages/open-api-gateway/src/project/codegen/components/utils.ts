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

export interface GenerateClientCodeOptions {
  readonly language: ClientLanguage;
  readonly specPath: string;
  readonly outputPath: string;
  readonly packageName: string;
}

/**
 * Generate client code by invoking the root generate script
 */
export const generateClientCode = (options: GenerateClientCodeOptions) => {
  exec(
    `./generate --spec-path ${options.specPath} --output-path ${options.outputPath} --package-name ${options.packageName} --language ${options.language}`,
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
