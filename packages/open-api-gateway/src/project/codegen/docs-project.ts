/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { getLogger } from "log4js";
import { Project, ProjectOptions } from "projen";
import { DocumentationFormatConfig } from "../client-config";
import { DocumentationFormat } from "../languages";
import { GeneratedHtml2Docs } from "./components/docs/generated-html2-docs";
import { GeneratedMarkdownDocs } from "./components/docs/generated-markdown-docs";
import { GeneratedPlantUmlDocs } from "./components/docs/generated-plantuml-docs";

const logger = getLogger();

/**
 * Configuration for the OpenAPI docs project
 */
export interface DocsProjectOptions extends ProjectOptions {
  /**
   * The absolute path to the OpenAPI specification (spec.yaml) from which to generate docs
   */
  readonly specPath: string;
  /**
   * The formats to generate documentation in
   */
  readonly formatConfigs: DocumentationFormatConfig[];
}

/**
 * Project containing generated OpenApi docs
 */
export class DocsProject extends Project {
  constructor(options: DocsProjectOptions) {
    super(options);
    // HACK: remove all components but the ones we are registering - removes .gitignore, tasks, etc since these are
    // unused and a distraction for end-users!
    // @ts-ignore
    this._components = [];

    // Generate docs in all specified formats
    options.formatConfigs.forEach((formatConfig) => {
      logger.trace(
        `${formatConfig.documentationFormat} :: generate = ${formatConfig.generate}`
      );
      if (formatConfig.generate) {
        this.generateDocs(formatConfig.documentationFormat, options.specPath);
      }
    });
  }

  /**
   * Generates the docs in the given format
   */
  generateDocs(format: DocumentationFormat, specPath: string) {
    switch (format) {
      case DocumentationFormat.HTML2:
        return new GeneratedHtml2Docs(this, { specPath });
      case DocumentationFormat.MARKDOWN:
        return new GeneratedMarkdownDocs(this, { specPath });
      case DocumentationFormat.PLANTUML:
        return new GeneratedPlantUmlDocs(this, { specPath });
      default:
        throw new Error(`Unsupported documentation format ${format}`);
    }
  }
}
