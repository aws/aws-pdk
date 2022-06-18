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
import { SampleDir, SampleFile, TextFile, YamlFile } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { exec } from "projen/lib/util";
import { GeneratedTypescriptClientProject } from "./codegen/generated-typescript-client-project";
import { ClientLanguage } from "./languages";
import {
  getTypescriptSampleSource,
  getTypescriptSampleTests,
  TypescriptSampleCodeOptions,
} from "./samples/typescript";
import { OpenApiSpecProject } from "./spec/open-api-spec-project";

const OPENAPI_GATEWAY_PDK_PACKAGE_NAME =
  "@aws-prototyping-sdk/open-api-gateway";

/**
 * Configuration for the OpenApiGatewayTsProject
 */
export interface OpenApiGatewayTsProjectOptions
  extends TypeScriptProjectOptions {
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
}

/**
 * Synthesizes a Typescript Project with an OpenAPI spec, generated clients, a CDK construct for deploying the API
 * with API Gateway, and generated lambda handler wrappers for type-safe handling of requests.
 *
 * @pjid open-api-gateway-ts
 */
export class OpenApiGatewayTsProject extends TypeScriptProject {
  /**
   * A reference to the generated typescript client
   */
  public readonly generatedTypescriptClient: TypeScriptProject;

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
   * Reference to the PNPM workspace yaml file which adds the dependency between this project and the generated
   * typescript client when this project is used in a monorepo, and the package manager is PNPM.
   */
  public readonly pnpmWorkspace?: YamlFile;

  private readonly hasParent: boolean;

  constructor(options: OpenApiGatewayTsProjectOptions) {
    super({
      ...options,
      sampleCode: false,
      tsconfig: {
        compilerOptions: {
          lib: ["dom", "es2019"],
        },
      },
    });

    if (options.specFile) {
      this.specDir = path.dirname(options.specFile);
      this.specFileName = path.basename(options.specFile);
    } else {
      this.specDir = "spec";
      this.specFileName = "spec.yaml";
    }
    this.generatedCodeDir = options.generatedCodeDir ?? "generated";
    this.apiSrcDir = options.apiSrcDir ?? "api";

    // Allow json files to be imported (for importing the parsed spec)
    this.tsconfig?.addInclude(`${this.srcdir}/**/*.json`);

    // Set to private since this either uses workspaces or has file dependencies
    this.package.addField("private", true);

    // Generated project should have a dependency on this project, in order to run the generation scripts
    this.addDeps(OPENAPI_GATEWAY_PDK_PACKAGE_NAME, "constructs", "aws-cdk-lib");

    // Synthesize the openapi spec early since it's used by the generated typescript client, which is also synth'd early
    const spec = new OpenApiSpecProject({
      name: `${this.name}-spec`,
      parent: this,
      outdir: path.join(this.srcdir, this.specDir),
      specFileName: this.specFileName,
      parsedSpecFileName: options.parsedSpecFileName,
    });
    spec.synth();

    new TextFile(this, path.join(this.generatedCodeDir, "README.md"), {
      lines: [
        "## Generated Clients",
        "",
        "This directory contains generated client code based on your OpenAPI Specification file (spec.yaml).",
        "",
        "Like other `projen` managed files, this directory should be checked in to source control, but should not be edited manually.",
      ],
      readonly: true,
    });

    // Parent the generated code with this project's parent for better integration with monorepos
    this.hasParent = !!options.parent;
    const generatedCodeDirRelativeToParent = this.hasParent
      ? path.join(options.outdir!, this.generatedCodeDir)
      : this.generatedCodeDir;

    // We generate the typescript client since this project will take a dependency on it in order to produce the
    // type-safe cdk construct wrapper.
    this.generatedTypescriptClient = new GeneratedTypescriptClientProject({
      parent: this.hasParent ? options.parent : this,
      defaultReleaseBranch: options.defaultReleaseBranch,
      name: `${this.package.packageName}-typescript`,
      outdir: path.join(
        generatedCodeDirRelativeToParent,
        ClientLanguage.TYPESCRIPT
      ),
      // Use the parsed spec such that refs are resolved to support multi-file specs
      specPath: spec.parsedSpecPath,
      packageManager: options.packageManager,
    });

    // Synth early so that the generated code is available prior to this project's install phase
    this.generatedTypescriptClient.synth();

    const typescriptCodeGenDir = path.relative(
      this.outdir,
      this.generatedTypescriptClient.outdir
    );

    if (this.hasParent) {
      // When we have a parent project, we can add a dependency on the generated typescript client since it's part of
      // the monorepo. Since this project will be synthesized before the parent monorepo, the generated typescript
      // client won't be visible for the first install in this project's post synthesize step, so we use a local
      // workspace as a workaround.
      if (this.package.packageManager === NodePackageManager.PNPM) {
        this.pnpmWorkspace = new YamlFile(this, "pnpm-workspace.yaml", {
          readonly: true,
          obj: {
            packages: [typescriptCodeGenDir],
          },
        });
      } else {
        this.package.addField("workspaces", {
          packages: [typescriptCodeGenDir],
        });
      }
      // Add the dependency
      this.addDeps(this.generatedTypescriptClient.package.packageName);
      // Since the generated typescript client project is parented by this project's parent rather than this project,
      // projen will clean up the generated client when synthesizing this project unless we add an explicit exclude.
      this.addExcludeFromCleanup(`${this.generatedCodeDir}/**/*`);
    } else {
      // Add a file dependency on the generated typescript client
      this.addDeps(
        `${this.generatedTypescriptClient.package.packageName}@file:./${typescriptCodeGenDir}`
      );

      // Linting runs post synthesize before the typescript client has been built
      this.eslint?.addRules({
        "import/no-unresolved": [
          2,
          { ignore: [this.generatedTypescriptClient.package.packageName] },
        ],
      });
    }

    // Additional languages to generate other than typescript which is mandatory
    const extraLanguages = new Set(options.clientLanguages);
    extraLanguages.delete(ClientLanguage.TYPESCRIPT);
    // TODO: generate clients in other given languages

    // Generate the sample source and test code
    const sampleOptions: TypescriptSampleCodeOptions = {
      openApiGatewayPackageName: OPENAPI_GATEWAY_PDK_PACKAGE_NAME,
      typescriptClientPackageName:
        this.generatedTypescriptClient.package.packageName,
      sampleCode: options.sampleCode,
      apiSrcDir: path.join(this.srcdir, this.apiSrcDir),
      specDir: this.specDir,
      parsedSpecFileName: spec.parsedSpecFileName,
    };
    new SampleFile(this, path.join(this.srcdir, "index.ts"), {
      contents: `export * from "./${this.apiSrcDir}";`,
    });
    new SampleDir(this, path.join(this.srcdir, this.apiSrcDir), {
      files: getTypescriptSampleSource(sampleOptions),
    });
    new SampleDir(this, this.testdir, {
      files: getTypescriptSampleTests(sampleOptions),
    });
  }

  /**
   * @inheritDoc
   */
  postSynthesize() {
    // When no parent is passed, link the generated client as a prebuild step to ensure the latest built generated
    // client is reflected in this package's node modules.
    // Note that it's up to the user to manage building the generated client first.
    !this.hasParent && this.executeLinkNativeClientCommands();

    super.postSynthesize();
  }

  /**
   * Executes commands to link the native (ie typescript) client such that updates to the generated client are reflected
   * in this project's node_modules (when not managed by a monorepo)
   * @private
   */
  private executeLinkNativeClientCommands() {
    switch (this.package.packageManager) {
      case NodePackageManager.NPM:
      case NodePackageManager.YARN:
        exec(`${this.package.packageManager} link`, {
          cwd: this.generatedTypescriptClient.outdir,
        });
        exec(
          `${this.package.packageManager} link ${this.generatedTypescriptClient.package.packageName}`,
          {
            cwd: this.outdir,
          }
        );
        break;
      case NodePackageManager.PNPM:
        exec(
          `${this.package.packageManager} link ./${path.relative(
            this.outdir,
            this.generatedTypescriptClient.outdir
          )}`,
          {
            cwd: this.outdir,
          }
        );
        break;
      default:
        throw new Error(
          `Unsupported package manager ${this.package.packageManager}`
        );
    }
  }
}
