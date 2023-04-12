/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { Job, JobPermission, JobStep } from "projen/lib/github/workflows-model";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import { NodePackageUtils } from "../../../utils";

/** @experimental */
export namespace DevOpsWorkflows {
  export function context(value: string): string {
    return `\${{ ${value} }}`;
  }

  export namespace Constants {
    export const MAIN_BRANCH = "mainline";

    export namespace Github {
      export const RUN_ID = context("github.run_id");
      export namespace Event {
        export const EVENT_NUMBER = context("github.event.number");
        export namespace PullRequest {
          export const HEAD_REF = context("github.event.pull_request.head.ref");
          export const HEAD_REPO_FULL_NAME = context(
            "github.event.pull_request.head.repo.full_name"
          );
        }
      }
    }
  }

  export namespace Actions {
    /** @internal */
    function _checkout(options: any): JobStep[] {
      return [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
          with: {
            ...options,
          },
        },
      ];
    }

    export function checkoutPullRequest(): JobStep[] {
      return _checkout({
        ref: Constants.Github.Event.PullRequest.HEAD_REF,
        repository: Constants.Github.Event.PullRequest.HEAD_REPO_FULL_NAME,
      });
    }

    export function checkoutFullHistory(): JobStep[] {
      return _checkout({
        "fetch-depth": 0,
      });
    }

    export function checkoutGithubPages(): JobStep[] {
      return _checkout({
        ref: "gh-pages",
        "fetch-depth": 0,
      });
    }

    export function setupNode(project: Project): JobStep[] {
      const nodePackage = NodePackageUtils.tryFindNodePackage(project);

      return [
        {
          name: "Setup Node",
          id: "node-install",
          uses: "actions/setup-node@v3",
          with: {
            "node-version":
              nodePackage?.maxNodeVersion || nodePackage?.minNodeVersion || 18,
          },
        },
      ];
    }

    export function setupPnpm(
      project: Project,
      cache: boolean = true,
      install: boolean = true
    ): JobStep[] {
      const nodePackage = NodePackageUtils.tryFindNodePackage(project);

      const steps: JobStep[] = [
        {
          name: "Install pnpm",
          id: "pnpm-install",
          uses: "pnpm/action-setup@v2",
          with: {
            version: nodePackage?.pnpmVersion || 8,
            run_install: false,
          },
        },
      ];

      if (cache) {
        steps.push(
          ...[
            {
              name: "Get pnpm store directory",
              id: "pnpm-store",
              // @ts-ignore
              shell: "bash",
              run: 'echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT',
            },
            {
              name: "Setup pnpm cache",
              id: "pnpm-cache",
              uses: "actions/cache@v3",
              with: {
                path: "${{ steps.pnpm-store.outputs.STORE_PATH }}",
                key: "${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}",
                "restore-keys": "${{ runner.os }}-pnpm-store-",
              },
            },
          ]
        );
      }

      if (install) {
        steps.push({
          name: "Install dependencies",
          id: "pnpm-dependencies",
          // @ts-ignore
          shell: "bash",
          run: "pnpm install --frozen-lockfile --prefer-offline",
        });
      }

      return steps;
    }

    export function packageManagerTask(
      project: Project,
      task: string,
      args?: string[],
      options?: JobStep
    ): JobStep[] {
      const packageManager: NodePackageManager =
        NodePackageUtils.findNodePackage(project).packageManager;

      return [
        {
          name: `${packageManager} ${task}`,
          ...options,
          run: NodePackageUtils.taskCommand(project, task, ...(args || [])),
        },
      ];
    }

    export function runManyTask(
      project: Project,
      task: string,
      args?: string[],
      options?: JobStep
    ): JobStep[] {
      return packageManagerTask(
        project,
        "run-many",
        [`--target=${task}`, ...(args || [])],
        options
      );
    }

    export function buildTask(project: Project): JobStep[] {
      if (project instanceof NodeProject) {
        return packageManagerTask(project, "build", [], {
          env: {
            NX_CLOUD_NO_TIMEOUTS: "true",
          },
        });
      }

      throw new Error("Build task only support NodeProjects at this time");
    }

    export function projenSynth(
      project: Project,
      options?: JobStep
    ): JobStep[] {
      return [
        {
          name: "Synth Project",
          id: "projen-synth",
          // @ts-ignore
          shell: "bash",
          run: NodePackageUtils.taskCommand(project, "projen"),
          env: {
            // By default do not run HUSKY install
            HUSKY: "0",
          },
          ...options,
        },
      ];
    }

    export function checkForMutations(): JobStep[] {
      return [
        {
          name: "Check for mutations",
          run: "git diff --ignore-space-at-eol --exit-code",
        },
      ];
    }

    export function uploadArtifact(
      name: string,
      path: string,
      options?: JobStep
    ): JobStep[] {
      return [
        {
          name: "Upload artifact",
          uses: "actions/upload-artifact@v2.1.1",
          ...options,
          with: {
            ...options?.with,
            name,
            path,
          },
        },
      ];
    }

    export function downloadArtifact(
      name: string,
      path: string,
      options?: JobStep
    ): JobStep[] {
      return [
        {
          name: "Download build artifacts",
          uses: "actions/download-artifact@v2",
          ...options,
          with: {
            ...options?.with,
            name,
            path,
          },
        },
      ];
    }

    export function nxSetShas(branch: string): JobStep[] {
      return [
        {
          name: "Derive appropriate SHAs for base and head for `nx affected` commands",
          id: "nx-set-shas",
          uses: "nrwl/nx-set-shas@v2",
          with: {
            "main-branch-name": branch,
          },
        },
      ];
    }
  }

  export namespace Jobs {
    export function skipDuplicates(name: string): Job {
      // https://github.com/marketplace/actions/skip-duplicate-actions
      return {
        name,
        permissions: {
          actions: JobPermission.WRITE,
          contents: JobPermission.READ,
        },
        runsOn: ["ubuntu-latest"],
        outputs: {
          should_skip: {
            outputName: "should_skip",
            stepId: "skip_check",
          },
        },
        steps: [
          {
            id: "skip_check",
            uses: "fkirc/skip-duplicate-actions@v5",
            with: {
              concurrent_skipping: "never",
              skip_after_successful_duplicate: "true",
              do_not_skip: '["pull_request", "workflow_dispatch", "schedule"]',
            },
          },
        ],
      };
    }
  }
}
