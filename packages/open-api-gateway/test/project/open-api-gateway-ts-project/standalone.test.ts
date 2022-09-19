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
import { NodePackageManager } from "projen/lib/javascript";
import { synthSnapshot } from "projen/lib/util/synth";
import { ClientLanguage, OpenApiGatewayTsProject } from "../../../src";

describe("OpenAPI Gateway Ts Standalone Unit Tests", () => {
  it.each([
    NodePackageManager.YARN,
    NodePackageManager.NPM,
    NodePackageManager.PNPM,
  ])("With Package Manager %s", (packageManager) => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [
        ClientLanguage.TYPESCRIPT,
        ClientLanguage.PYTHON,
        ClientLanguage.JAVA,
      ],
      packageManager,
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Honours Dependency Versions", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [],
      deps: [
        "@aws-prototyping-sdk/open-api-gateway@0.10.2",
        "constructs@10.1.7",
        "aws-cdk-lib@2.39.0",
      ],
    });

    expect(
      project.deps.getDependency("@aws-prototyping-sdk/open-api-gateway")
        .version
    ).toBe("0.10.2");
    expect(project.deps.getDependency("constructs").version).toBe("10.1.7");
    expect(project.deps.getDependency("aws-cdk-lib").version).toBe("2.39.0");
  });
});
