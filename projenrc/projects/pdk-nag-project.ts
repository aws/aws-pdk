/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { PDKProject } from "../abstract/pdk-project";

/**
 * Contains utils for testing CDK based constructs.
 */
export class PDKNagProject extends PDKProject {
  constructor(parent: Project) {
    super({
      parent,
      outdir: "packages/pdk-nag",
      defaultReleaseBranch: "mainline",
      sampleCode: false,
      jest: true,
      name: "pdk-nag",
      depsUpgrade: false,
      peerDeps: ["aws-cdk-lib", "constructs", "cdk-nag"],
      devDeps: [
        "cdk-nag",
        "@aws-cdk/assert",
        "@types/fs-extra",
        "@types/mustache",
        "mustache",
        "fs-extra",
        "ts-node",
      ],
      author: "AWS APJ COPE",
      authorAddress: "apj-cope@amazon.com",
      repositoryUrl: "https://github.com/aws/aws-prototyping-sdk",
      stability: Stability.STABLE,
      eslintOptions: {
        dirs: ["src", "scripts"],
      },
    });
    this.packageTask.exec("npx ts-node scripts/generate-pack-markdown.ts");
    this.tsconfigEslint!.addInclude("scripts");
    this.eslint?.addRules({
      "import/no-extraneous-dependencies": [
        "error",
        { devDependencies: ["scripts/**/*.ts", "**/*.test.ts"] },
      ],
    });
  }
}
