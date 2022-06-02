// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import { SampleDir, TextFile } from "projen";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { TypescriptCodegenProject } from "./codegen/typescript-codegen-project";
import { ClientLanguage } from "./languages";
import {
  getTypescriptSampleSource,
  getTypescriptSampleTests,
  TypescriptSampleCodeOptions,
} from "./samples/typescript";
import { OpenApiSpec } from "./spec/open-api-spec";

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
}

/**
 * Synthesizes a Typescript Project with an OpenAPI spec, generated clients, a CDK construct for deploying the API
 * with API Gateway, and generated lambda handler wrappers for type-safe handling of requests.
 *
 * @pjid open-api-gateway-ts
 */
export class OpenApiGatewayTsProject extends TypeScriptProject {
  constructor(options: OpenApiGatewayTsProjectOptions) {
    super({
      ...options,
      sampleCode: false,
      tsconfig: {
        compilerOptions: {
          rootDir: ".",
          lib: ["dom", "es2019"],
        },
      },
    });

    // Generated project should have a dependency on this project, in order to run the generation scripts
    this.addDeps(OPENAPI_GATEWAY_PDK_PACKAGE_NAME, "constructs", "aws-cdk-lib");

    const specDir = "spec";

    // Synthesize the sample spec and parse it on synthesis
    const spec = new OpenApiSpec({
      parent: this,
      name: `${this.name}-spec`,
      outdir: specDir,
    });
    spec.synth();

    // Allow spec to be imported
    this.tsconfig?.addInclude(`${specDir}/**/*.json`);

    const nativeClientPackageName = `${this.package.packageName}-typescript`;

    const codegenDir = "generated";
    const typescriptCodeGenDir = path.join(
      codegenDir,
      ClientLanguage.TYPESCRIPT
    );

    // Parent the generated code with this project's parent for better integration with monorepos
    const hasParent = options.parent && options.outdir;
    const codegenDirRelativeToParent = hasParent
      ? path.join(options.outdir!, codegenDir)
      : codegenDir;

    new TextFile(this, path.join(codegenDirRelativeToParent, "README.md"), {
      lines: [
        "## Generated Clients",
        "",
        "This directory contains generated client code based on your OpenAPI Specification file (spec.yaml).",
        "",
        "Like other `projen` managed files, this directory should be checked in to source control, but should not be edited manually.",
      ],
      readonly: true,
    });

    // We always generate the typescript client for the type safe construct wrapper
    const codegenProject = new TypescriptCodegenProject({
      parent: hasParent ? options.parent : this,
      defaultReleaseBranch: "mainline",
      name: nativeClientPackageName,
      outdir: path.join(codegenDirRelativeToParent, ClientLanguage.TYPESCRIPT),
      specPath: spec.specPath,
    });
    codegenProject.synth();

    // Add a file dependency on the generated typescript client
    this.addDeps(`${nativeClientPackageName}@file:./${typescriptCodeGenDir}`);

    // Additional languages to generate other than typescript which is mandatory
    const extraLanguages = new Set(options.clientLanguages);
    extraLanguages.delete(ClientLanguage.TYPESCRIPT);
    // TODO: generate clients in other given languages

    // Generate the sample source and test code
    const sampleOptions: TypescriptSampleCodeOptions = {
      openApiGatewayPackageName: OPENAPI_GATEWAY_PDK_PACKAGE_NAME,
      typescriptClientPackageName: nativeClientPackageName,
      sampleCode: options.sampleCode,
    };
    new SampleDir(this, this.srcdir, {
      files: getTypescriptSampleSource(sampleOptions),
    });
    new SampleDir(this, this.testdir, {
      files: getTypescriptSampleTests(sampleOptions),
    });
  }
}
