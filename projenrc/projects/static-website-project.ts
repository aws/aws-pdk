/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjenStruct, Struct } from "@mrgrain/jsii-struct-builder";
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject, PDK_NAMESPACE } from "../abstract/pdk-project";

/**
 * Contains configuration for the StaticWebsiteProject.
 */
export class StaticWebsiteProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "static-website",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-pdk",
      devDeps: [
        "projen",
        "@types/aws-lambda",
        "@aws-sdk/client-s3",
        "@aws-sdk/client-kms",
        "@aws-sdk/client-wafv2",
        "aws-cdk-lib",
        "constructs",
        "cdk-nag",
      ],
      peerDeps: ["projen", "aws-cdk-lib", "constructs", "cdk-nag"],
      deps: [`${PDK_NAMESPACE}pdk-nag@^0.x`],
      stability: Stability.STABLE,
    });

    this.generateInterfaces();
  }

  private generateInterfaces() {
    new ProjenStruct(this, {
      name: "BucketDeploymentProps",
      filePath: `${this.srcdir}/bucket-deployment-props.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(
        Struct.fromFqn("aws-cdk-lib.aws_s3_deployment.BucketDeploymentProps")
      )
      .allOptional();

    new ProjenStruct(this, {
      name: "DistributionProps",
      filePath: `${this.srcdir}/distribution-props.ts`,
      outputFileOptions: {
        readonly: false, // Needed as EsLint will complain otherwise
      },
    })
      .mixin(Struct.fromFqn("aws-cdk-lib.aws_cloudfront.DistributionProps"))
      .allOptional();

    this.eslint?.addIgnorePattern(`${this.srcdir}/bucket-deployment-props.ts`);
    this.eslint?.addIgnorePattern(`${this.srcdir}/distribution-props.ts`);
  }
}
