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
 * Contains configuration for the IdentityProject.
 */
export class IdentityProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "identity",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: [
        "projen",
        "aws-cdk-lib",
        "constructs",
        "cdk-nag",
        "@aws-prototyping-sdk/pdk-nag@0.0.0",
        "@aws-cdk/aws-cognito-identitypool-alpha",
      ],
      peerDeps: [
        "projen",
        "aws-cdk-lib",
        "constructs",
        "cdk-nag",
        "@aws-cdk/aws-cognito-identitypool-alpha",
      ],
      stability: Stability.EXPERIMENTAL,
    });

    this.addPackageIgnore("**/node_modules");
  }
}
