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
import { getLogger } from "log4js";
import { Component, JsonFile, Project } from "projen";
import { tryReadFileSync } from "projen/lib/util";
import {
  ClientLanguageConfig,
  DocumentationFormatConfig,
} from "../../client-config";
import { ClientLanguage, DocumentationFormat } from "../../languages";

// initialize logger
const logger = getLogger();

/**
 * Configuration for the ClientConfig component
 */
export interface ClientSettingsOptions {
  /**
   * The name of the client config file.
   * @default ".client-settings.json"
   */
  readonly clientSettingsFilename?: string;

  /**
   * The path to the generated code dir.
   */
  readonly generatedCodeDir: string;

  /**
   * Client languages set at current run.
   */
  readonly clientLanguages: ClientLanguage[];

  /**
   * Default client language.
   */
  readonly defaultClientLanguage: ClientLanguage;

  /**
   * Documentation formats set at current run.
   */
  readonly documentationFormats: DocumentationFormat[];

  /**
   * Indicates whether the OpenApiSpec has changed.
   */
  readonly specChanged: boolean;

  /**
   * Indicates whether the user set the forceGenerate flag.
   */
  readonly forceGenerateCodeAndDocs: boolean;
}

/**
 * Component for parsing the yaml OpenAPI spec as a single json object, resolving references etc.
 */
export class ClientSettings extends Component {
  public readonly clientSettingsPath: string;

  public readonly clientSettingsFilename: string;

  public readonly clientLanguageConfigs: ClientLanguageConfig[];
  public readonly documentationFormatConfigs: DocumentationFormatConfig[];

  private readonly options: ClientSettingsOptions;

  constructor(project: Project, options: ClientSettingsOptions) {
    super(project);

    this.options = options;

    this.clientSettingsFilename =
      options.clientSettingsFilename ?? ".client-settings.json";
    this.clientSettingsPath = path.join(
      options.generatedCodeDir,
      this.clientSettingsFilename
    );

    // load previously generated client config
    const clientSettingsPathAbs = path.join(
      project.outdir,
      this.clientSettingsPath
    );
    logger.trace(`Reading client settings from ${clientSettingsPathAbs}`);
    const existingClientConfig = tryReadFileSync(clientSettingsPathAbs);

    const prevClientLanguages = new Set<ClientLanguage>();
    const prevDocFormats = new Set<DocumentationFormat>();

    if (existingClientConfig) {
      const parsedClientConfig = JSON.parse(existingClientConfig);

      // previously generated client settings
      parsedClientConfig.clientLanguages.map((l: ClientLanguage) =>
        prevClientLanguages.add(l)
      );
      parsedClientConfig.documentationFormats.map((d: DocumentationFormat) =>
        prevDocFormats.add(d)
      );
    }

    this.clientLanguageConfigs = options.clientLanguages.map(
      (clientLanguage) => ({
        clientLanguage,
        isDefault: clientLanguage === options.defaultClientLanguage,
        generate:
          options.specChanged ||
          options.forceGenerateCodeAndDocs ||
          !prevClientLanguages.has(clientLanguage),
      })
    );

    this.documentationFormatConfigs = options.documentationFormats.map(
      (documentationFormat) => ({
        documentationFormat,
        generate:
          options.specChanged ||
          options.forceGenerateCodeAndDocs ||
          !prevDocFormats.has(documentationFormat),
      })
    );
  }

  synthesize(): void {
    // store the client config
    // this helps to optimize to re-generate projects when new language/doc format is
    // introduced while the spec doesn't change
    logger.trace(`Generating settings file to ${this.clientSettingsPath}`);
    const clientSettingsJsonFile = new JsonFile(
      this.project,
      this.clientSettingsPath,
      {
        obj: {
          clientLanguages: this.options.clientLanguages,
          documentationFormats: this.options.documentationFormats,
        },
        marker: true,
        editGitignore: false,
      }
    );
    logger.debug(
      `Generated settings file to ${clientSettingsJsonFile.absolutePath}`
    );
  }
}
