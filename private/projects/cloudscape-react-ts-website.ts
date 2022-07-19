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
import { ReactTypeScriptProject } from "projen/lib/web";
import { PDKProject } from "../pdk-project";
import { JEST_VERSION } from "./pdk-monorepo-project";

/**
 * Contains configuration for the CloudscapeReactTsWebsiteProject.
 */
export class CloudscapeReactTsWebsiteProject extends PDKProject {
  public sampleProject: Project;

  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "cloudscape-react-ts-website",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen"],
      peerDeps: ["projen"],
      stability: Stability.EXPERIMENTAL,
    });

    this.addPackageIgnore("**/node_modules");

    this.sampleProject = new CloudscapeReactTsSampleWebsiteProject(parent);
  }
}

/**
 * Nested CloudscapeReactTsSampleWebsiteProject configuration.
 */
class CloudscapeReactTsSampleWebsiteProject extends ReactTypeScriptProject {
  constructor(parent: Project) {
    super({
      parent,
      outdir: "packages/cloudscape-react-ts-website/samples",
      defaultReleaseBranch: "mainline",
      depsUpgrade: false,
      name: "@aws-prototyping-sdk/cloudscape-react-ts-sample-website",
      sampleCode: false,
      jestOptions: {
        jestVersion: JEST_VERSION,
      },
      devDeps: ["@babel/plugin-proposal-private-property-in-object"],
      deps: [
        "@cloudscape-design/global-styles",
        "@cloudscape-design/components",
        "@cloudscape-design/collection-hooks",
        "react-router-dom",
        "aws-amplify",
        "@aws-amplify/ui-react",
      ],
      gitignore: ["runtime-config.json"],
    });

    this.npmignore?.include("src", "public");
    this.package.addField("private", true);
    this.testTask.reset(
      "react-scripts test --watchAll=false --passWithNoTests"
    );
  }
}
