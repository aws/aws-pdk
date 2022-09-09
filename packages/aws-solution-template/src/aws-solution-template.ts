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

 import * as fs from "fs";
 import * as path from "path";
 import { SampleDir } from "projen";
 import {
  ReactTypeScriptProject,
  ReactTypeScriptProjectOptions,
 } from "projen/lib/web";
 
 /**
  * Configuration options for the CloudscapeReactTsWebsiteProject.
  */
 export interface AwsSolutionTemplateProjectOptions
  extends ReactTypeScriptProjectOptions {
  /**
  * Name of the solution.
  *
  * @required
  */
  readonly solutionName: string;

  /**
  * The infra options of the solution. (The infra is created by AWS CDK)
  *
  * @default Undefined
  */
  readonly solutionInfraOptions?: AwsSolutionInfraOptions | undefined;

  /**
  * The portal options of the solution.
  *
  * @default Undefined
  */
  readonly solutionPortalOptions?: AwsSolutionInfraOptions | undefined;
 }

 export interface AwsSolutionInfraOptions {

 }

 export interface AwsSolutionPortalOptions {
  /**
  * The dir path for the solution portal.
  *
  * @default source/portal
  */
  portalDir?: string
 }

 export class AwsSolutionTemplateProject extends ReactTypeScriptProject {
  public readonly solutionName: String;
  public readonly solutionInfraOptions: AwsSolutionInfraOptions | undefined;
  public readonly solutionPortalOptions: AwsSolutionPortalOptions | undefined;

  constructor(options: AwsSolutionTemplateProjectOptions) {
    super({
      ...options,
      defaultReleaseBranch: options.defaultReleaseBranch,
      name: options.solutionName,
      sampleCode: false,
      readme: {
        contents: fs
          .readFileSync(path.resolve(__dirname, "../README.md"))
          .toString(),
      },
      gitignore: ["aws-exports.json"],
    });

    this.solutionName = options.solutionName;
    this.solutionInfraOptions = options.solutionInfraOptions;
    this.solutionPortalOptions = options.solutionPortalOptions;

    this.generateInfra();
    this.generatePortal();
  }

  private generateInfra(): void {
    if (!this.solutionInfraOptions) return;
    // generate infra through cdk
  }

  private generatePortal(): void {
    if (!this.solutionPortalOptions) return;

    this.addDevDeps("@babel/plugin-proposal-private-property-in-object");
    this.addDeps(
      "@apollo/client",
      "@aws-amplify/ui-components",
      "@aws-amplify/ui-react",
      "@material-ui/core",
      "@material-ui/icons",
      "@material-ui/lab",
      "@testing-library/jest-dom",
      "@testing-library/react",
      "@testing-library/user-event",
      "@types/jest",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "apollo-link",
      "aws-amplify",
      "aws-appsync-auth-link",
      "aws-appsync-subscription-link",
      "axios",
      "classnames",
      "date-fns",
      "graphql-tag",
      "i18next",
      "i18next-browser-languagedetector",
      "i18next-http-backend",
      "node-sass",
      "oidc-client-ts",
      "react",
      "react-copy-to-clipboard",
      "react-dom",
      "react-i18next",
      "react-oidc-context",
      "react-redux",
      "react-router-dom",
      "react-scripts",
      "redux",
      "sweetalert2",
      "typescript",
      "web-vitals"
    );

    this.testTask.reset();
    const lintTask = this.tasks.tryFind("eslint");
    lintTask && this.testTask.spawn(lintTask);
    this.testTask.exec("react-scripts test --watchAll=false --passWithNoTests");

    const solutionPortalName = this.solutionName + "-portal";
    const portalDir = this.solutionPortalOptions?.portalDir || "source/portal";
    const srcDir = path.resolve(__dirname, "../samples/src");
    new SampleDir(this, portalDir, {
      files: {
        ...Object.fromEntries(this.buildSampleDirEntries(srcDir)),
        "config.json": JSON.stringify(
          {
            applicationName: solutionPortalName,
          },
          undefined,
          2
        ),
      },
    });
  }

  private buildSampleDirEntries(
    dir: string,
    pathPrefixes: string[] = []
  ): [string, string][] {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((f) => f.name !== "config.json")
      .flatMap((f) =>
        f.isDirectory()
          ? this.buildSampleDirEntries(`${dir}/${f.name}`, [
              ...pathPrefixes,
              f.name,
            ])
          : [
              [
                `${path.join(...pathPrefixes, f.name)}`,
                fs.readFileSync(`${dir}/${f.name}`).toString(),
              ],
            ]
      );
  }
 }
 