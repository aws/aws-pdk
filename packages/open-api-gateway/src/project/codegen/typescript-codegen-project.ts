import { IgnoreFile } from "projen";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { GeneratedTypescriptClient } from "./components/generated-typescript-client";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Configuration for TypescriptCodegenProject
 */
export interface TypescriptCodegenProjectProps
  extends TypeScriptProjectOptions {
  /**
   * The absolute path to the OpenAPI specification (spec.yaml) from which to generate code
   */
  readonly specPath: string;
}

/**
 * Typescript project containing a typescript client (and lambda handler wrappers) generated using OpenAPI Generator CLI
 */
export class TypescriptCodegenProject extends TypeScriptProject {
  constructor(options: TypescriptCodegenProjectProps) {
    super({
      ...options,
      sampleCode: false,
      tsconfig: {
        compilerOptions: {
          lib: ["dom", "es2019"],
          // Generated code isn't very strict!
          strict: false,
          alwaysStrict: false,
          noImplicitAny: false,
          noImplicitReturns: false,
          noImplicitThis: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
          strictNullChecks: false,
          strictPropertyInitialization: false,
        },
      },
      eslint: false,
    });

    // Tell OpenAPI Generator CLI not to generate files that we will generate ourselves
    const openapiGeneratorIgnore = new IgnoreFile(
      this,
      ".openapi-generator-ignore"
    );
    openapiGeneratorIgnore.addPatterns(
      "package.json",
      "tsconfig.json",
      "src/index.ts"
    );

    new GeneratedTypescriptClient(this, {
      specPath: options.specPath,
    });
  }
}
