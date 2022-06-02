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
import { IgnoreFile } from "projen";
import { NodePackageManager, NpmConfig } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { GeneratedTypescriptClientSourceCode } from "./components/generated-typescript-client-source-code";

/**
 * Configuration for the generated typescript client project
 */
export interface GeneratedTypescriptClientProjectOptions
  extends TypeScriptProjectOptions {
  /**
   * The absolute path to the OpenAPI specification (spec.yaml) from which to generate code
   */
  readonly specPath: string;
}

/**
 * Typescript project containing a typescript client (and lambda handler wrappers) generated using OpenAPI Generator CLI
 */
export class GeneratedTypescriptClientProject extends TypeScriptProject {
  /**
   * A reference to the npm config (generated for PNPM projects)
   */
  public readonly npmConfig?: NpmConfig;

  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: GeneratedTypescriptClientProjectOptions) {
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

    // Disable strict peer dependencies for pnpm as the default typescript project dependencies have type mismatches
    // (ts-jest@27 and @types/jest@28)
    if (this.package.packageManager === NodePackageManager.PNPM) {
      this.npmConfig = new NpmConfig(this);
      this.npmConfig.addConfig("strict-peer-dependencies", "false");
    }

    // Tell OpenAPI Generator CLI not to generate files that we will generate via this project, or don't need.
    const openapiGeneratorIgnore = new IgnoreFile(
      this,
      ".openapi-generator-ignore"
    );
    openapiGeneratorIgnore.addPatterns(
      "package.json",
      "tsconfig.json",
      "tsconfig.esm.json",
      "src/index.ts"
    );

    new GeneratedTypescriptClientSourceCode(this, {
      specPath: options.specPath,
    });
  }

  synth() {
    // Save some time by only synthesizing once. We synthesize this project early so that it's available for the parent
    // project's install phase (pre-synth). Projen will call this method again at the usual time to synthesize this,
    // project, at which point we're already done so can skip.
    if (this.synthed) {
      return;
    }
    super.synth();
    this.synthed = true;
  }
}
