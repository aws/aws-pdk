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
    // add client settings file to .gitignore
    this.project.addGitIgnore(this.clientSettingsPath);

    // if spec changed --> generate all
    // if forceGenerate is on --> generate all
    if (options.specChanged || options.forceGenerateCodeAndDocs) {
      logger.debug(
        `specChanged=${options.specChanged}, forceGenerate=${options.forceGenerateCodeAndDocs} :: all clients and docs will be generated`
      );
      this.clientLanguageConfigs = this.getClientLanguageConfigs(
        options.clientLanguages,
        options.defaultClientLanguage
      );
      this.documentationFormatConfigs = this.getDocumentationFormatConfigs(
        options.documentationFormats
      );
    } else {
      // spec didn't change and forceGenerate is off
      // load previously generated client config
      const clientSettingsPathAbs = path.join(
        project.outdir,
        this.clientSettingsPath
      );
      logger.trace(`Reading client settings from ${clientSettingsPathAbs}`);
      const existingClientConfig = tryReadFileSync(clientSettingsPathAbs);
      if (existingClientConfig != null) {
        const parsedClientConfig = JSON.parse(existingClientConfig);

        // previously generated client settings
        const prevClientLanguages = parsedClientConfig.clientLanguages;
        const prevDocFormats = parsedClientConfig.documentationFormats;

        const currClientLanguages = options.clientLanguages;
        const currDocFormats = options.documentationFormats;

        // keep only those lang/doc formats that were not present previously
        this.clientLanguageConfigs = this.getClientLanguageConfigs(
          currClientLanguages.filter(
            (lang) => !prevClientLanguages.includes(lang)
          ),
          options.defaultClientLanguage
        );
        this.documentationFormatConfigs = this.getDocumentationFormatConfigs(
          currDocFormats.filter((format) => !prevDocFormats.includes(format))
        );
      } else {
        logger.debug(
          `No generated client settings file found at ${clientSettingsPathAbs}. All languages and docs will be generated`
        );
        this.clientLanguageConfigs = this.getClientLanguageConfigs(
          options.clientLanguages,
          options.defaultClientLanguage
        );
        this.documentationFormatConfigs = this.getDocumentationFormatConfigs(
          options.documentationFormats
        );
      }
    }
  }

  getClientLanguageConfigs(
    clientLanguages: ClientLanguage[],
    defaultLanguage: ClientLanguage
  ): ClientLanguageConfig[] {
    const values = Object.values(ClientLanguage);

    return values.map((currLang) => {
      return <ClientLanguageConfig>{
        clientLanguage: currLang,
        isDefault: defaultLanguage === currLang,
        generate: clientLanguages.includes(currLang),
      };
    });
  }

  getDocumentationFormatConfigs(
    documentationFormats: DocumentationFormat[]
  ): DocumentationFormatConfig[] {
    const values = Object.values(DocumentationFormat);

    return values.map((currFormat) => {
      return <DocumentationFormatConfig>{
        documentationFormat: currFormat,
        generate: documentationFormats.includes(currFormat),
      };
    });
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
