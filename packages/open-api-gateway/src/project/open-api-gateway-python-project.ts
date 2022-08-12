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
import { Project, SampleDir, SampleFile, TextFile } from "projen";
import { PythonProject, PythonProjectOptions } from "projen/lib/python";
import { ClientSettings } from "./codegen/components/client-settings";
import { DocsProject } from "./codegen/docs-project";
import { generateClientProjects } from "./codegen/generate";
import { GeneratedPythonClientProject } from "./codegen/generated-python-client-project";
import { ClientLanguage } from "./languages";
import {
  getPythonSampleSource,
  PythonSampleCodeOptions,
} from "./samples/python";
import { OpenApiSpecProject } from "./spec/open-api-spec-project";
import { OpenApiGatewayProjectOptions } from "./types";

const OPENAPI_GATEWAY_PDK_PACKAGE_NAME = "aws_prototyping_sdk.open_api_gateway";

/**
 * Configuration for the OpenApiGatewayPythonProject
 */
export interface OpenApiGatewayPythonProjectOptions
  extends PythonProjectOptions,
    OpenApiGatewayProjectOptions {}

/**
 * Synthesizes a Python Project with an OpenAPI spec, generated clients, a CDK construct for deploying the API
 * with API Gateway, and generated lambda handler wrappers for type-safe handling of requests.
 *
 * @pjid open-api-gateway-py
 */
export class OpenApiGatewayPythonProject extends PythonProject {
  /**
   * A reference to the generated python client
   */
  public readonly generatedPythonClient: PythonProject;

  /**
   * References to the client projects that were generated, keyed by language
   */
  public readonly generatedClients: { [language: string]: Project };

  /**
   * The directory in which the OpenAPI spec file(s) reside, relative to the project srcdir
   */
  public readonly specDir: string;

  /**
   * The directory in which the api generated code will reside, relative to the project srcdir
   */
  public readonly apiSrcDir: string;

  /**
   * The name of the spec file
   */
  public readonly specFileName: string;

  /**
   * The directory in which generated client code will be generated, relative to the outdir of this project
   */
  public readonly generatedCodeDir: string;

  /**
   * Force to generate code and docs even if there were no changes in spec
   */
  public readonly forceGenerateCodeAndDocs?: boolean;

  private readonly hasParent: boolean;

  constructor(options: OpenApiGatewayPythonProjectOptions) {
    super({
      ...options,
      sample: false,
      venv: true,
      venvOptions: {
        envdir: ".env",
        ...options?.venvOptions,
      },
      pip: true,
      poetry: false,
      pytest: false,
      setuptools: true,
    });

    if (options.specFile) {
      this.specDir = path.dirname(options.specFile);
      this.specFileName = path.basename(options.specFile);
    } else {
      this.specDir = "spec";
      this.specFileName = "spec.yaml";
    }
    this.generatedCodeDir = options.generatedCodeDir ?? "generated";
    this.forceGenerateCodeAndDocs = options.forceGenerateCodeAndDocs ?? false;
    this.apiSrcDir = options.apiSrcDir ?? "api";

    // Generated project should have a dependency on this project, in order to run the generation scripts
    [
      OPENAPI_GATEWAY_PDK_PACKAGE_NAME,
      "constructs",
      "aws-cdk-lib",
      "cdk-nag",
    ].forEach((dep) => this.addDependency(dep));

    // Synthesize the openapi spec early since it's used by the generated python client, which is also synth'd early
    const spec = new OpenApiSpecProject({
      name: `${this.name}-spec`,
      parent: this,
      outdir: path.join(this.moduleName, this.specDir),
      specFileName: this.specFileName,
      parsedSpecFileName: options.parsedSpecFileName,
    });
    spec.synth();

    // Parent the generated code with this project's parent for better integration with monorepos
    this.hasParent = !!options.parent;
    const generatedCodeDirRelativeToParent = this.hasParent
      ? path.join(options.outdir!, this.generatedCodeDir)
      : this.generatedCodeDir;

    // Always generate the python client since this project will take a dependency on it in order to produce the
    // type-safe cdk construct wrapper.
    const clientLanguages = new Set(options.clientLanguages);
    clientLanguages.add(ClientLanguage.PYTHON);

    const clientSettings = new ClientSettings(this, {
      clientLanguages: [...clientLanguages],
      defaultClientLanguage: ClientLanguage.PYTHON,
      documentationFormats: options.documentationFormats ?? [],
      forceGenerateCodeAndDocs: this.forceGenerateCodeAndDocs,
      generatedCodeDir: this.generatedCodeDir,
      specChanged: spec.specChanged,
    });

    // Share the same env between this project and the generated client. Accept a custom venv if part of a monorepo
    const envDir = options.venvOptions?.envdir || ".env";
    // env directory relative to the generated python client
    const clientEnvDir = path.join(
      "..",
      ...this.generatedCodeDir.split("/").map(() => ".."),
      envDir
    );

    this.generatedClients = generateClientProjects(
      clientSettings.clientLanguageConfigs,
      {
        parent: this.hasParent ? options.parent! : this,
        parentPackageName: this.name,
        generatedCodeDir: generatedCodeDirRelativeToParent,
        parsedSpecPath: spec.parsedSpecPath,
        typescriptOptions: {
          defaultReleaseBranch: "main",
          ...options.typescriptClientOptions,
        },
        pythonOptions: {
          authorName: options.authorName ?? "APJ Cope",
          authorEmail: options.authorEmail ?? "apj-cope@amazon.com",
          version: "0.0.0",
          ...options.pythonClientOptions,
          // We are more prescriptive about the generated client since we must set up a dependency in the shared env
          pip: true,
          poetry: false,
          venv: true,
          venvOptions: {
            envdir: clientEnvDir,
          },
          generateLayer: true,
        },
        javaOptions: {
          version: "0.0.0",
          ...options.javaClientOptions,
        },
      }
    );

    this.generatedPythonClient = this.generatedClients[
      ClientLanguage.PYTHON
    ] as GeneratedPythonClientProject;

    // Synth early so that the generated code is available prior to this project's install phase
    this.generatedPythonClient.synth();

    // Add a dependency on the generated python client, which should be available since we share the virtual env
    this.addDependency(this.generatedPythonClient.moduleName);

    if (this.hasParent) {
      // Since the generated python client project is parented by this project's parent rather than this project,
      // projen will clean up the generated client when synthesizing this project unless we add an explicit exclude.
      this.addExcludeFromCleanup(`${this.generatedCodeDir}/**/*`);
    }

    // Get the lambda layer dir relative to the root of this project
    const pythonLayerDistDir = path.join(
      this.generatedCodeDir,
      ClientLanguage.PYTHON,
      (this.generatedPythonClient as GeneratedPythonClientProject).layerDistDir
    );

    // Ensure it's included in the package
    new TextFile(this, "MANIFEST.in", {
      lines: [`recursive-include ${pythonLayerDistDir} *`],
    });

    // Generate the sample source and test code
    const sampleOptions: PythonSampleCodeOptions = {
      openApiGatewayPackageName: OPENAPI_GATEWAY_PDK_PACKAGE_NAME,
      pythonClientPackageName: this.generatedPythonClient.moduleName,
      sampleCode: options.sample,
      specDir: this.specDir,
      parsedSpecFileName: spec.parsedSpecFileName,
      moduleName: this.moduleName,
    };

    // Define some helpers for resolving resource paths in __init__.py
    new SampleFile(this, path.join(this.moduleName, "__init__.py"), {
      contents: `import pkgutil, json
from os import path
from pathlib import Path

SPEC_PATH = path.join(str(Path(__file__).absolute().parent), "${this.specDir}/${spec.parsedSpecFileName}")
SPEC = json.loads(pkgutil.get_data(__name__, "${this.specDir}/${spec.parsedSpecFileName}"))

def get_project_root():
    return Path(__file__).absolute().parent.parent

def get_generated_client_layer_directory():
    return path.join(str(get_project_root()), "${pythonLayerDistDir}")
`,
    });

    new SampleDir(this, path.join(this.moduleName, this.apiSrcDir), {
      files: getPythonSampleSource(sampleOptions),
    });

    // Set up pytest manually since the default pytest generates tests for sample code which doesn't exist
    const pytestVersion = options.pytestOptions?.version || "6.2.1";
    this.addDevDependency(`pytest@${pytestVersion}`);
    this.testTask.exec("pytest");

    // Generate documentation if needed
    new DocsProject({
      parent: this,
      outdir: path.join(this.generatedCodeDir, "documentation"),
      name: "docs",
      formatConfigs: clientSettings.documentationFormatConfigs,
      specPath: spec.parsedSpecPath,
    });
  }
}
