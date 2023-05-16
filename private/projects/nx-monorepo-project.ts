/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../pdk-project";

/**
 * Contains configuration for the NXMonorepoProject.
 */
export class NXMonorepoProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      defaultReleaseBranch: "mainline",
      name: "nx-monorepo",
      keywords: ["aws", "pdk", "jsii", "projen"],
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      devDeps: ["projen", "nx", "@types/fs-extra", "@types/semver"],
      peerDeps: ["projen"],
      bundledDeps: [
        "fs-extra",
        "semver",
        "@pnpm/reviewing.dependencies-hierarchy",
      ],
      stability: Stability.STABLE,
    });

    this.compileTask.exec(
      'rsync -a ./src/** ./lib --include="*/" --include="**/*.js" --exclude="*" --prune-empty-dirs'
    );

    this.package.addBin({ "pdk-release-version-post": "./scripts/release-version-post.ts" });
    this.package.addBin({ "pdk-release-version-sync": "./scripts/release-version-sync.ts" });

    this.package.addBin({ "pdk-nx-dir-hasher": "./scripts/nx-dir-hasher.js" });

    this.package.addBin({
      "pdk-pnpm-link-bundled-transitive-deps":
        "./scripts/pnpm/link-bundled-transitive-deps.ts",
    });
  }
}
