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
import { IgnoreFile, Project } from "projen";

/**
 * Represents an .openapi-generator-ignore file
 * @see https://github.com/OpenAPITools/openapi-generator/blob/master/docs/customization.md#ignore-file-format
 */
export class OpenApiGeneratorIgnoreFile extends IgnoreFile {
  constructor(project: Project) {
    super(project, ".openapi-generator-ignore");

    // We should always use the projen .gitignore since projen manages the build, and therefore the ignored build
    // artifacts
    this.addPatterns(".gitignore");
  }
}
