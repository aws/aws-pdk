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

import * as path from "path";
import {
  CloudscapeReactTsWebsiteProject,
  CloudscapeReactTsWebsiteProjectOptions,
} from "@aws-prototyping-sdk/cloudscape-react-ts-website";
import { awscdk, SampleDir } from "projen";
import { AwsCdkTypeScriptAppOptions } from "projen/lib/awscdk";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";

/**
 * Configuration options for the CloudscapeReactTsWebsiteProject.
 */
export interface AwsSolutionTemplateProjectOptions
  extends TypeScriptProjectOptions {
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
  readonly solutionPortalOptions?: AwsSolutionPortalOptions | undefined;
}

export interface AwsSolutionInfraOptions {
  /**
   * The dir path for the solution portal.
   *
   * @default source/constructs
   */
  readonly infraDir?: string;
}

export interface AwsSolutionPortalOptions {
  /**
   * The dir path for the solution portal.
   *
   * @default source/portal
   */
  readonly portalDir?: string;
}

export class AwsSolutionTemplateProject extends TypeScriptProject {
  public readonly solutionName: string;
  public readonly solutionInfraOptions: AwsSolutionInfraOptions | undefined;
  public readonly solutionPortalOptions: AwsSolutionPortalOptions | undefined;

  constructor(options: AwsSolutionTemplateProjectOptions) {
    super({
      ...options,
      defaultReleaseBranch: options.defaultReleaseBranch,
      name: options.solutionName,
      sampleCode: false,
    });

    this.solutionName = options.solutionName;
    this.solutionInfraOptions = options.solutionInfraOptions;
    this.solutionPortalOptions = options.solutionPortalOptions;

    this.generateFiles();
    this.generateSolutionDocs();
    this.generateInfra();
    this.generatePortal();
  }

  private generateFiles(): void {
    // copy deploy files
    new SampleDir(this, "deployment", {
      sourceDir: path.resolve(__dirname, "../samples/deployment"),
    });

    // copy source files
    new SampleDir(this, "source", {
      sourceDir: path.resolve(__dirname, "../samples/source"),
    });
  }

  private generateSolutionDocs(): void {
    // TODO: create doc project once aws-solution-docs project pushed to npm
  }

  private generateInfra(): void {
    if (!this.solutionInfraOptions) return;
    // generate infra through cdk
    const infraDir = this.solutionInfraOptions.infraDir ?? "source/constructs";
    const params: AwsCdkTypeScriptAppOptions = {
      parent: this,
      outdir: infraDir,
      cdkVersion: "2.1.0",
      defaultReleaseBranch: "mainline",
      name: this.solutionName,
    };
    new awscdk.AwsCdkTypeScriptApp(params);
  }

  private generatePortal(): void {
    if (!this.solutionPortalOptions) return;
    const portalDir = this.solutionPortalOptions.portalDir ?? "source/portal";
    const param: CloudscapeReactTsWebsiteProjectOptions = {
      parent: this,
      outdir: portalDir,
      applicationName: this.solutionName ?? "",
      name: this.solutionName + "-portal",
      defaultReleaseBranch: "mainline",
    };
    new CloudscapeReactTsWebsiteProject(param);
  }
}
