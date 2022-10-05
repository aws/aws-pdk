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
import {
  ClientLanguage,
  SmithyApiGatewayTsProject,
} from "../../../src/project";
import { synthSmithyCodeProject } from "../smithy-test-utils";

describe("Smithy Api Gateway Ts Monorepo Unit Tests", () => {
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
    new SmithyApiGatewayTsProject({
      parent: monorepo,
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [
        ClientLanguage.TYPESCRIPT,
        ClientLanguage.PYTHON,
        ClientLanguage.JAVA,
      ],
      outdir: "packages/api",
      packageManager,
      serviceName: { namespace: "example.hello", serviceName: "Hello" },
    });
    expect(synthSmithyCodeProject(monorepo)).toMatchSnapshot();
  });
});
