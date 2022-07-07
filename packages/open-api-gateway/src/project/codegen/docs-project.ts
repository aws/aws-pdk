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

import { Project, ProjectOptions } from "projen";
import { DocumentationFormat } from "../languages";
import { GeneratedHtml2Docs } from "./components/docs/generated-html2-docs";
import { GeneratedMarkdownDocs } from "./components/docs/generated-markdown-docs";
import { GeneratedPlantUmlDocs } from "./components/docs/generated-plantuml-docs";

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
  readonly formats: DocumentationFormat[];
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
    options.formats.forEach((format) =>
      this.generateDocs(format, options.specPath)
    );
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
