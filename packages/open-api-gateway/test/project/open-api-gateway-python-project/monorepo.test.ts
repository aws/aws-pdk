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
import { synthSnapshot } from "projen/lib/util/synth";
import {
  ClientLanguage,
  OpenApiGatewayPythonProject,
} from "../../../src/project";

describe("OpenAPI Gateway Python Monorepo Unit Tests", () => {
  it("Within Monorepo With Package Manager %s", () => {
    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "@test/monorepo",
    });
    new OpenApiGatewayPythonProject({
      parent: monorepo,
      outdir: "packages/my_api",
      moduleName: "my_api",
      name: "my_api",
      authorName: "test",
      authorEmail: "test@example.com",
      version: "1.0.0",
      clientLanguages: [
        ClientLanguage.TYPESCRIPT,
        ClientLanguage.PYTHON,
        ClientLanguage.JAVA,
      ],
    });
    expect(synthSnapshot(monorepo)).toMatchSnapshot();
  });
});
