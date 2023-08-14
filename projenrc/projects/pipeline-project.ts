/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Stability } from "projen/lib/cdk";
import { NxMonorepoProject } from "../../packages/nx-monorepo/src";
import { PDKProject, PDK_NAMESPACE } from "../abstract/pdk-project";

/**
 * Contains configuration for the PipelineProject.
 */
export class PipelineProject extends PDKProject {
  constructor(parent: NxMonorepoProject) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "pipeline",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen", "aws-cdk-lib", "constructs", "cdk-nag"],
      peerDeps: ["projen", "aws-cdk-lib", "constructs", "cdk-nag"],
      deps: [`${PDK_NAMESPACE}pdk-nag@^0.x`],
      stability: Stability.STABLE,
    });

    this.postCompileTask.prependExec("cp -r src/lambda lib");
  }
}
