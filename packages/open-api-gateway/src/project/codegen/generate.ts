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
import { Project } from "projen";
import { ClientLanguage } from "../languages";
import {
  GeneratedPythonClientProject,
  GeneratedPythonClientProjectOptions,
} from "./generated-python-client";
import {
  GeneratedTypescriptClientProject,
  GeneratedTypescriptClientProjectOptions,
} from "./generated-typescript-client-project";

// Some options that we'll infer automatically for each client project, unless overridden
type CommonProjectOptions = "specPath" | "name" | "outdir" | "moduleName";

/**
 * Options for generating clients
 */
export interface GenerateClientProjectsOptions {
  /**
   * The parent project for the generated clients
   */
  readonly parent?: Project;
  /**
   * Whether or not the root api project has a parent (ie whether or not we are in a monorepo)
   */
  readonly rootProjectHasParent: boolean;
  /**
   * The name of the api package, used to infer client names unless overrides are specified
   */
  readonly parentPackageName: string;
  /**
   * The directory in which to generate code for all clients
   */
  readonly generatedCodeDir: string;
  /**
   * Path to the parsed spec file
   * We use the parsed spec such that refs are resolved to support multi-file specs
   */
  readonly parsedSpecPath: string;
  /**
   * Options for the typescript client project.
   * These will override any inferred properties (such as the package name).
   */
  readonly typescriptOptions: Omit<
    GeneratedTypescriptClientProjectOptions,
    CommonProjectOptions
  >;
  /**
   * Options for the python client project
   * These will override any inferred properties (such as the package name).
   */
  readonly pythonOptions: Omit<
    GeneratedPythonClientProjectOptions,
    CommonProjectOptions
  >;
}

/**
 * Returns a generated client project for the given language
 */
const generateClientProject = (
  language: ClientLanguage,
  options: GenerateClientProjectsOptions
): Project => {
  switch (language) {
    case ClientLanguage.TYPESCRIPT:
      return new GeneratedTypescriptClientProject({
        parent: options.parent,
        // Ensure kebab-case for typescript
        name: `${options.parentPackageName}-${ClientLanguage.TYPESCRIPT}`.replace(
          /_/g,
          "-"
        ),
        outdir: path.join(options.generatedCodeDir, ClientLanguage.TYPESCRIPT),
        specPath: options.parsedSpecPath,
        ...options.typescriptOptions,
      });
    case ClientLanguage.PYTHON:
      // Ensure snake_case for python
      const name = `${options.parentPackageName}_${ClientLanguage.PYTHON}`
        .replace(/@/g, "")
        .replace(/[\-/]/g, "_");
      return new GeneratedPythonClientProject({
        parent: options.parent,
        rootProjectHasParent: options.rootProjectHasParent,
        name,
        moduleName: name,
        outdir: path.join(options.generatedCodeDir, ClientLanguage.PYTHON),
        specPath: options.parsedSpecPath,
        ...options.pythonOptions,
      });
    default:
      throw new Error(`Unknown client language ${language}`);
  }
};

/**
 * Generate API clients in the given languages
 * @param languages the languages to generate clients for
 * @param options options for the projects to be created
 */
export const generateClientProjects = (
  languages: Set<ClientLanguage>,
  options: GenerateClientProjectsOptions
): { [language: string]: Project } =>
  Object.fromEntries(
    [...languages].map((language) => [
      language,
      generateClientProject(language, options),
    ])
  );
