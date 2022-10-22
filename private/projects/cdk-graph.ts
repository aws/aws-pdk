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

/**
 * cdk-graph project.
 */
export class CdkGraphProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "cdk-graph",
      keywords: ["aws", "pdk", "jsii", "projen", "cdk", "graph", "cdk-graph"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: [
        "@aws-cdk/cfnspec",
        "@types/lodash.clonedeep",
        "@types/lodash.isempty",
        "@types/lodash.merge",
        "@types/lodash.omit",
        "@types/lodash.uniq",
        "@types/lodash.uniqby",
        "@types/traverse",
        "aws-cdk-lib",
        "constructs",
        "projen",
      ],
      peerDeps: ["projen", "aws-cdk-lib", "constructs"],
      bundledDeps: [
        "chalk@4",
        "find-up",
        "fs-extra",
        "lodash.clonedeep",
        "lodash.isempty",
        "lodash.merge",
        "lodash.omit",
        "lodash.uniq",
        "lodash.uniqby",
        "shorthash2",
        "traverse",
      ],
      stability: Stability.EXPERIMENTAL,
      tsconfig: {
        compilerOptions: {
          esModuleInterop: true,
        },
      },
      tsconfigDev: {
        compilerOptions: {
          noEmit: true,
          noUnusedLocals: false,
          noImplicitAny: false,
          noImplicitReturns: false,
          noImplicitThis: false,
          noUnusedParameters: false,
        },
      },
    });

    this.addPackageIgnore("**/node_modules");

    this.eslint?.addIgnorePattern("scripts/**");

    this.jest?.addIgnorePattern("/\\.tmp/");
    this.jest?.addIgnorePattern("/__\\w+__/");
    this.jest?.addWatchIgnorePattern("/\\.tmp/");
  }
}
