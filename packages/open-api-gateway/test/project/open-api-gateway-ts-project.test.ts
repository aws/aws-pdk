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

import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { NodePackageManager } from "projen/lib/javascript";
import { synthSnapshot } from "projen/lib/util/synth";
import { ClientLanguage, OpenApiGatewayTsProject } from "../../src/project";

describe("OpenAPI Gateway Ts Unit Tests", () => {
  // Disable post synthesis for each test, given generated code is synthesized early, during the construction of the
  // project.
  // See https://github.com/projen/projen/blob/e5899dd04a575209424a08fe90bde99e07ac6c7b/src/util/synth.ts#L33
  const ENV_PROJEN_DISABLE_POST = process.env.PROJEN_DISABLE_POST;

  beforeEach(() => {
    // Disable post synth
    process.env.PROJEN_DISABLE_POST = "true";
  });

  afterEach(() => {
    // Restore projen post synth environment
    if (ENV_PROJEN_DISABLE_POST === undefined) {
      delete process.env.PROJEN_DISABLE_POST;
    } else {
      process.env.PROJEN_DISABLE_POST = ENV_PROJEN_DISABLE_POST;
    }
  });

  it.each([
    NodePackageManager.YARN,
    NodePackageManager.NPM,
    NodePackageManager.PNPM,
  ])("With Package Manager %s", (packageManager) => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [ClientLanguage.TYPESCRIPT],
      packageManager,
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Without Sample Code", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [ClientLanguage.TYPESCRIPT],
      sampleCode: false,
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it.each([
    NodePackageManager.YARN,
    NodePackageManager.NPM,
    NodePackageManager.PNPM,
  ])("Within Monorepo With Package Manager %s", (packageManager) => {
    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "@test/monorepo",
      packageManager,
    });
    new OpenApiGatewayTsProject({
      parent: monorepo,
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [ClientLanguage.TYPESCRIPT],
      outdir: "packages/api",
      packageManager,
    });
    expect(synthSnapshot(monorepo)).toMatchSnapshot();
  });
});
