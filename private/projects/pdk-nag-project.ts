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
import { TypeScriptProject } from "projen/lib/typescript";

/**
 * Contains utils for testing CDK based constructs.
 */
export class PDKNagProject extends TypeScriptProject {
  constructor(parent: Project) {
    super({
      parent,
      outdir: "tools/pdk-nag",
      defaultReleaseBranch: "mainline",
      sampleCode: false,
      jest: false,
      name: "@aws-prototyping-sdk/pdk-nag",
      depsUpgrade: false,
      peerDeps: ["aws-cdk-lib", "constructs"],
      deps: ["cdk-nag"],
    });

    this.package.addField("private", true);
  }
}
