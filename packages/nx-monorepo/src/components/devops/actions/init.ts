/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { JobStep } from "projen/lib/github/workflows-model";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import { CompositeAction } from "./composite";
import { DevOpsWorkflows } from "../workflow/common";

/** @experimental */
export interface InitActionOptions {
  readonly name?: string;
  readonly description?: string;
  readonly actionPath?: string;
}

/** @experimental */
export class InitAction extends CompositeAction {
  static readonly ACTION: string = "pdk/init";

  constructor(project: Project, options?: InitActionOptions) {
    super(project, "pdk-init", {
      name: "PDK Init",
      description:
        "Initialize the repo by installing engines, dependencies, and synthesizing the project via projen.",
      ...options,
    });
  }

  renderSteps(): JobStep[] {
    const steps: JobStep[] = [];

    if (this.project instanceof NodeProject) {
      steps.push(...DevOpsWorkflows.Actions.setupNode(this.project));

      switch (this.project.package.packageManager) {
        case NodePackageManager.PNPM: {
          // https://github.com/pnpm/action-setup
          steps.push(...DevOpsWorkflows.Actions.setupPnpm(this.project));
          break;
        }
        // TODO: support yarn, npm, etc
        default: {
          this.project.logger.warn(
            `[InitAction] NodePackageManager "${this.project.package.packageManager}" setup not defined - may have limited support.`
          );
        }
      }

      steps.push(...DevOpsWorkflows.Actions.projenSynth(this.project));
    }

    return steps;
  }
}
