/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Job, JobPermission, JobStep } from "projen/lib/github/workflows-model";
import { BaseWorkflow, BaseWorkflowOptions } from "./base";
import { DevOpsWorkflows } from "./common";

/** @experimental */
export interface BuildWorkflowOptions extends BaseWorkflowOptions {
  readonly name?: string;
}

/** @experimental */
export class BuildWorkflow extends BaseWorkflow {
  constructor(project: Project, options: BuildWorkflowOptions) {
    super(project, options.name || "build", {
      ...options,
      env: {
        NX_BRANCH: DevOpsWorkflows.Constants.Github.Event.EVENT_NUMBER,
        ...options.env,
      },
    });

    this.on({
      pullRequest: {},
      workflowDispatch: {},
      mergeGroup: {
        // @ts-ignore - https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#merge_group
        types: ["checks_requested"],
      },
    });

    this.addJob("pre_build", this._renderPreBuildJob());
    this.addJob("build", this._renderBuildJob());
  }

  /**
   * @internal
   */
  protected _renderPreBuildJob(): Job {
    // https://github.com/marketplace/actions/skip-duplicate-actions
    return DevOpsWorkflows.Jobs.skipDuplicates("pre_build");
  }

  /**
   * @internal
   */
  protected _renderBuildJob(): Job {
    const steps: JobStep[] = [
      // checkout
      ...DevOpsWorkflows.Actions.checkoutPullRequest(),
      // init
      this.initAction.use(),
      // build
      ...DevOpsWorkflows.Actions.buildTask(this.project),
      // mutation check
      ...DevOpsWorkflows.Actions.checkForMutations(),
    ];

    return {
      permissions: {
        contents: JobPermission.WRITE,
      },
      runsOn: ["ubuntu-latest"],
      outputs: {
        self_mutation_happened: {
          outputName: "self_mutation_happened",
          stepId: "self_mutation",
        },
      },
      steps,
    };
  }
}
