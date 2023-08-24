/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjenStruct, Struct } from "@mrgrain/jsii-struct-builder";
import { Stability } from "projen/lib/cdk";
import { MonorepoTsProject } from "../../packages/monorepo/src";
import { PDKProject, PDK_NAMESPACE } from "../abstract/pdk-project";

/**
 * Contains configuration for the PipelineProject.
 */
export class PipelineProject extends PDKProject {
  constructor(parent: MonorepoTsProject) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "pipeline",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-pdk",
      devDeps: ["projen", "aws-cdk-lib", "constructs", "cdk-nag"],
      peerDeps: ["projen", "aws-cdk-lib", "constructs", "cdk-nag"],
      deps: [`${PDK_NAMESPACE}pdk-nag@^0.x`],
      stability: Stability.STABLE,
    });

    this.postCompileTask.prependExec("cp -r src/lambda lib");
    this.generateInterfaces();
  }

  private generateInterfaces() {
    new ProjenStruct(this, {
      name: "CodePipelineProps",
      filePath: `${this.srcdir}/codepipeline-props.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("aws-cdk-lib.pipelines.CodePipelineProps"))
      .allOptional();

    this.eslint?.addIgnorePattern(`${this.srcdir}/codepipeline-props.ts`);
  }
}
