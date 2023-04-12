/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import {
  GitHub,
  GithubWorkflow,
  GithubWorkflowOptions,
} from "projen/lib/github";
import { DevOpsWorkflows } from "./common";
import { InitAction } from "../actions/init";

/** @experimental */
export interface BaseWorkflowOptions extends GithubWorkflowOptions {
  readonly github: GitHub;
  readonly initAction: InitAction;

  /**
   * Workflow root level environment vars to apply to all jobs
   */
  readonly env?: Record<string, string>;
}

/** @experimental */
export abstract class BaseWorkflow extends GithubWorkflow {
  protected readonly github: GitHub;
  protected readonly initAction: InitAction;

  constructor(_project: Project, name: string, options: BaseWorkflowOptions) {
    super(options.github, name, options);

    this.github = options.github;
    this.initAction = options.initAction;

    this.file?.addOverride("env", {
      NX_NON_NATIVE_HASHER: "true",
      NX_RUN_GROUP: DevOpsWorkflows.Constants.Github.RUN_ID,
      NX_CLOUD_ACCESS_TOKEN: "${{ secrets.NX_CLOUD_ACCESS_TOKEN }}",
      ...options?.env,
    });
  }

  addEnv(key: string, value: string): void {
    this.file?.addOverride(`env.${key}`, value);
  }
}
