/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../pdk-project";

/**
 * Contains configuration for the CloudscapeReactTsWebsiteProject.
 */
export class CloudscapeReactTsWebsiteProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "cloudscape-react-ts-website",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: [
        "projen",
        "@types/mustache",
        "@aws-prototyping-sdk/nx-monorepo@^0.x",
      ],
      deps: ["@aws-prototyping-sdk/type-safe-api@^0.x"],
      peerDeps: ["projen", "@aws-prototyping-sdk/type-safe-api@^0.x"],
      bundledDeps: ["mustache"],
      stability: Stability.EXPERIMENTAL,
    });
  }
}
