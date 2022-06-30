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
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../pdk-project";
import { JEST_VERSION } from "./pdk-monorepo-project";

/**
 * Contains configuration for the OpenApiGateway project.
 */
export class OpenApiGatewayProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "open-api-gateway",
      keywords: ["aws", "pdk", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: [
        "@aws-prototyping-sdk/nx-monorepo@0.0.0",
        "projen",
        "aws-cdk-lib",
        "constructs",
      ],
      deps: ["fs-extra"],
      bundledDeps: ["openapi-types", "fs-extra"],
      peerDeps: ["projen", "aws-cdk-lib", "constructs"],
      stability: Stability.EXPERIMENTAL,
      eslintOptions: {
        dirs: ["src", "scripts"],
      },
      jestOptions: {
        jestVersion: JEST_VERSION,
        jestConfig: {
          globalSetup: "<rootDir>/jest.setup.ts",
        },
      },
    });

    this.eslint?.addRules({ "import/no-unresolved": ["off"] });
    this.tsconfigEslint!.addInclude("scripts");

    this.addPackageIgnore("**/node_modules");
  }
}
