/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Component, Project } from "projen";
import { GitHub } from "projen/lib/github";
import { InitAction } from "./actions/init";
import { BuildWorkflow } from "./workflow/build";
import { ReleaseWorkflow } from "./workflow/release";

/** @experimental */
export interface DevOpsOptions {
  /**
   * Target devops tool - currently only supports github, but will add CodeCatalyst and others later on.
   */
  readonly target?: "github";

  /**
   * {@link GitHub} instance used to customize github setup. If not specified, `GitHub.of(project)`
   * will be called to attempt to find relative instance, otherwise a default instance will be created.
   */
  readonly github?: GitHub;

  /**
   * {@link InitAction} instance used to customize setup. If undefined, a default instance will be created.
   */
  readonly initAction?: InitAction;
  /**
   * {@link BuildWorkflow} instance used to customize setup. If undefined, a default instance will be created.
   *
   * If `false`, then the build workflow will not be utilized.
   */
  readonly buildWorkflow?: BuildWorkflow | false;
  /**
   * {@link ReleaseWorkflow} instance used to customize setup. If undefined, a default instance will be created.
   *
   * If `false`, then the release workflow will not be utilized.
   */
  readonly releaseWorkflow?: ReleaseWorkflow | false;
}

/** @experimental */
export class DevOps extends Component {
  static of(project: Project): DevOps | undefined {
    return project.components.find((c) => c instanceof DevOps) as
      | DevOps
      | undefined;
  }

  readonly github: GitHub;

  readonly initAction: InitAction;

  readonly buildWorkflow?: BuildWorkflow;

  readonly releaseWorkflow?: ReleaseWorkflow;

  constructor(project: Project, options?: DevOpsOptions) {
    super(project);

    const github = (this.github =
      options?.github ||
      GitHub.of(project) ||
      new GitHub(project, {
        mergify: false,
        downloadLfs: false,
        pullRequestLint: false,
        workflows: true,
      }));

    this.github.actions.set("actions/checkout", "actions/checkout@v3");

    const initAction = (this.initAction =
      options?.initAction || new InitAction(project));

    if (options?.buildWorkflow !== false) {
      this.buildWorkflow =
        options?.buildWorkflow ||
        new BuildWorkflow(project, {
          github,
          initAction,
        });
    }

    if (options?.releaseWorkflow !== false) {
      this.releaseWorkflow =
        options?.releaseWorkflow ||
        new ReleaseWorkflow(project, {
          github,
          initAction,
        });
    }
  }
}
