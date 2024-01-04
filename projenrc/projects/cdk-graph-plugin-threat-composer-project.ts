/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Stability } from "projen/lib/cdk";
import { CdkGraphPluginProject } from "../abstract/cdk-graph-plugin-project";
import { PDK_NAMESPACE } from "../abstract/pdk-project";

/**
 * Project for cdk-graph-plugin-threat-composer package
 */
export class CdkGraphPluginThreatComposerProject extends CdkGraphPluginProject {
  constructor(parent: Project) {
    super({
      parent,
      pluginName: "threat-composer",
      devDeps: [
        `${PDK_NAMESPACE}pdk-nag@^0.x`,
        "cdk-nag",
        "@types/lodash",
        "fs-extra",
      ],
      bundledDeps: ["lodash"],
      peerDeps: [`${PDK_NAMESPACE}pdk-nag@^0.x`, "cdk-nag"],
      stability: Stability.EXPERIMENTAL,
    });

    this.jest!.addIgnorePattern("/\\.tmp/");
    this.jest!.addWatchIgnorePattern("/\\.tmp/");
  }
}
