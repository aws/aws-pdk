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
import { Project, TaskStep } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../pdk-project";

/**
 * Contains configuration for the BarneoProject.
 */
export class AwsArchProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "aws-arch",
      keywords: ["aws", "pdk", "jsii", "projen", "icons", "assets", "cfnspec"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: [
        "@aws-cdk/cfnspec",
        "@types/node-fetch@2",
        "@types/sharp",
        "@types/unzipper",
        "@types/xml-flow",
        "fs-extra",
        "lodash",
        "node-fetch@2",
        "projen",
        "sharp",
        "tree-cli",
        "unzipper",
        "xml-flow",
      ],
      peerDeps: ["projen"],
      stability: Stability.EXPERIMENTAL,
    });

    this.addPackageIgnore("**/node_modules");

    this.eslint?.addIgnorePattern("scripts/**");
    this.addGitIgnore("/src/generated/");
    this.addGitIgnore("/assets/");

    this.jest?.addIgnorePattern("src/internal/");

    this.package.addField("files", [
      "assets",
      "lib",
      "LICENSE_THIRD_PARTY",
      "NOTICE",
      "jsii",
    ]);

    const generateTasks = [
      this.addTask("generate:assets", {
        exec: "ts-node ./scripts/generate-assets.ts",
      }),
      this.addTask("generate:cfnspec-types", {
        exec: "ts-node ./scripts/generate-cfnspec-types.ts",
      }),
      this.addTask("generate:drawio-spec", {
        exec: "ts-node ./scripts/generate-drawio-spec.ts",
      }),
      this.addTask("generate:pricing-manifest", {
        exec: "ts-node ./scripts/generate-pricing-manifest.ts",
      }),
      this.addTask("generate:mappings", {
        exec: "ts-node ./scripts/generate-mappings.ts",
      }),
    ];

    const generateTask = this.addTask("generate", {
      steps: generateTasks.map(
        (task): TaskStep => ({
          spawn: task.name,
        })
      ),
    });

    const prebuildTask = this.addTask("prebuild", {
      condition: '[ ! -d "./assets" ]',
    });
    prebuildTask.spawn(generateTask);
  }
}
