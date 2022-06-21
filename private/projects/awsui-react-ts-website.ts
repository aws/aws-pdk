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
import { ReactTypeScriptProject } from "projen/lib/web";

/**
 * Contains configuration for the AwsUiReactTsWebsiteProject.
 */
export class AwsUiReactTsWebsiteProject extends PDKProject {
  public sampleProject: Project;

  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "awsui-react-ts-website",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen"],
      deps: ["projen"],
      peerDeps: ["projen"],
      stability: Stability.EXPERIMENTAL,
    });

    this.addPackageIgnore("**/node_modules");

    this.sampleProject = new AwsUiReactTsSampleWebsiteProject(parent);
  }
}

/**
 * Nested AwsUiReactTsSampleWebsiteProject configuration.
 */
class AwsUiReactTsSampleWebsiteProject extends ReactTypeScriptProject {
  constructor(parent: Project) {
    super({
      parent,
      outdir: "packages/awsui-react-ts-website/sample",
      defaultReleaseBranch: "mainline",
      name: "@aws-prototyping-sdk/awsui-react-ts-sample-website",
      sampleCode: false,
      devDeps: ["@babel/plugin-proposal-private-property-in-object"],
      deps: ["@awsui/global-styles", "@awsui/components-react", "@awsui/collection-hooks", "react-router-dom", "aws-amplify", "@aws-amplify/ui-react"],
      gitignore: ["runtime-config.json"],
    });

    this.npmignore?.include("src", "public");
    this.package.addField("private", true);
    this.testTask.reset("react-scripts test --watchAll=false --passWithNoTests");
  }
}

