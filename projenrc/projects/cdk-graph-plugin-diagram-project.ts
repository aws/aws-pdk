/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { JestReporter } from "projen/lib/javascript";
import { CdkGraphPluginProject } from "../abstract/cdk-graph-plugin-project";

/**
 * Project for `@@aws/cdk-graph-plugin-diagram` package.
 */
export class CdkGraphPluginDiagramProject extends CdkGraphPluginProject {
  constructor(parent: Project) {
    super({
      parent,
      pluginName: "diagram",
      keywords: [
        "cdk-dia",
        "cfn-dia",
        "dia",
        "diagram",
        "graphviz",
        "dot",
        "drawio",
      ],
      devDeps: [
        "@types/fs-extra",
        "@types/he",
        "@types/jest-image-snapshot",
        "@types/lodash.clonedeep",
        "@types/lodash.startcase",
        "@types/lodash.uniqby",
        "@types/lodash.words",
        "@types/sharp",
        "@types/to-px",
        "@types/traverse",
        "lodash",
        "ts-node",
        "downlevel-dts",
        "jest-image-snapshot",
      ],
      peerDeps: ["projen", "aws-cdk-lib", "constructs"],
      bundledDeps: [
        "execa@5.1.1",
        "fs-extra",
        "he",
        "lodash.clonedeep",
        "lodash.startcase",
        "lodash.uniqby",
        "lodash.words",
        "svgson",
        "to-px",
        "traverse",
        "ts-graphviz",
        "ts-node",
        "word-wrap",
      ],
      stability: Stability.STABLE,
      jestOptions: {
        jestConfig: {
          globals: {
            "ts-jest": {
              tsconfig: "tsconfig.test.json",
            },
          },
        },
      },
    });

    if (this.jest) {
      this.jest.addIgnorePattern("/\\.tmp/");
      this.jest.addIgnorePattern("/__\\w+__/");
      this.jest.addWatchIgnorePattern("/\\.tmp/");

      // Tests in this package consume a lot of memory and compute; reducing concurrency to limit effects
      // https://jestjs.io/docs/27.x/configuration#maxworkers-number--string
      this.jest.config.maxWorkers = "25%";
      // https://jestjs.io/docs/27.x/configuration#maxconcurrency-number
      this.jest.config.maxConcurrency = 2;

      // https://www.npmjs.com/package/jest-image-snapshot
      this.jest.addReporter(
        new JestReporter(
          "jest-image-snapshot/src/outdated-snapshot-reporter.js"
        )
      );
      this.testTask.env("JEST_IMAGE_SNAPSHOT_TRACK_OBSOLETE", "1");
      this.addGitIgnore(".jest-image-snapshot-touched-files");
    }
  }
}
