/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodePackageManager, NodeProject } from "projen/lib/javascript";

/**
 * Utility functions for working with different Node package managers.
 * @experimental
 */
export namespace NodePackageUtils {
  /**
   * Append arguments to command string.
   * @internal
   */
  function withArgs(cmd: string, args: string[]): string {
    if (args.length) {
      return `${cmd} ${args.join(" ")}`;
    }

    return cmd;
  }

  /**
   * Remove the "projen" script from package.json scripts, which causes recursive projen execution
   * for other scripts in format of "yarn projen [command]".
   * @param project NodeProject to remove "projen" script
   * @see https://github.com/projen/projen/blob/37983be94b37ee839ef3337a1b24b014a6c29f4f/src/javascript/node-project.ts#L512
   */
  export function removeProjenScript(project: NodeProject): void {
    project.package.removeScript("projen");
  }

  /**
   * Command based utilities
   */
  export namespace command {
    /**
     * Get command to run a script defined in the package.json
     */
    export function runScript(
      packageManager: NodePackageManager,
      ...args: string[]
    ): string {
      switch (packageManager) {
        case NodePackageManager.YARN:
        case NodePackageManager.YARN2:
          return withArgs("yarn run", args);
        case NodePackageManager.PNPM:
          return withArgs("pnpm run", args);
        default:
          return withArgs("npm run", args);
      }
    }

    /**
     * Get command to execute projen or a projen task
     */
    export function projen(
      packageManager: NodePackageManager,
      ...args: string[]
    ): string {
      return exec(packageManager, "projen", ...args);
    }

    /**
     * Get command to execute a shell command
     */
    export function exec(
      packageManager: NodePackageManager,
      ...args: string[]
    ): string {
      switch (packageManager) {
        case NodePackageManager.YARN:
          // "yarn exec" is not propagating transient args (`yarn exec nx run-many --target=build` does not receive `--target=build`)
          return withArgs("yarn", args);
        case NodePackageManager.YARN2:
          return withArgs("yarn exec", args);
        case NodePackageManager.PNPM:
          return withArgs("pnpm exec", args);
        default:
          return withArgs("npx", args);
      }
    }

    /**
     * Get command to run a package in a temporary environment
     */
    export function downloadExec(
      packageManager: NodePackageManager,
      ...args: string[]
    ): string {
      switch (packageManager) {
        case NodePackageManager.YARN2:
          return withArgs("yarn dlx", args);
        case NodePackageManager.PNPM:
          return withArgs("pnpm dlx", args);
        default:
          return withArgs("npx", args);
      }
    }

    /**
     * Get bash command for executing an executable in the package manager /bin dir.
     * Example: `$(yarn bin)/${cmd}`
     */
    export function bin(
      packageManager: NodePackageManager,
      cmd: string
    ): string {
      switch (packageManager) {
        case NodePackageManager.YARN:
        case NodePackageManager.YARN2:
          return `$(yarn bin)/${cmd}`;
        case NodePackageManager.PNPM:
          return `$(pnpm bin)/${cmd}`;
        default:
          return `$(npm bin)/${cmd}`;
      }
    }
  }
}
