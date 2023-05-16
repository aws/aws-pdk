/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import {
  NodePackageManager,
  NodeProject,
  NodePackage,
} from "projen/lib/javascript";

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

  /** Indicates if project is a node based project */
  export function isNodeProject(project: Project): boolean {
    return (
      project instanceof NodeProject ||
      tryFindNodePackage(project, false) != null
    );
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
   * Find the nearest {@link NodePackage} within scope. This will traverse parent
   * tree until finds projen with {@link NodePackage} component, or will throw
   * error if none found. Use {@link #tryFindNodePackage} if you do not want to
   * throw error.
   * @param scope The leaf project scope
   * @param {boolean} [recursive=false] Indicates if ancestral tree should be traversed
   * @returns {NodeProject} The NodeProject component for scope
   * @throws Error if {@link NodePackage} not found in tree of scope
   */
  export function findNodePackage(
    scope: Project,
    recursive: boolean = false
  ): NodePackage {
    const nodePackage = tryFindNodePackage(scope, recursive);
    if (nodePackage) {
      return nodePackage;
    }
    throw new Error(
      `Project ${scope.name} does not have NodePackage component.`
    );
  }

  /**
   * Try to find the nearest {@link NodePackage} within scope. This will traverse parent
   * tree until finds projen with {@link NodePackage} component.
   * @param scope The leaf project scope
   * @param {boolean} [recursive=false] Indicates if ancestral tree should be traversed
   * @returns {NodeProject} The NodeProject component for scope, or undefined if no projects are node based.
   */
  export function tryFindNodePackage(
    scope: Project,
    recursive: boolean = false
  ): NodePackage | undefined {
    let _project: Project | undefined = scope;
    while (_project) {
      const nodePackage = _project.components.find(
        (c) => c instanceof NodePackage
      ) as NodePackage | undefined;
      if (nodePackage) {
        return nodePackage;
      }
      if (!recursive) {
        return undefined;
      }
      _project = _project.parent;
    }
    return undefined;
  }

  /**
   * Gets the NodePackageManager for a given project if available or default.
   */
  export function resolvePackageManager(
    project: Project,
    defaultValue: NodePackageManager = NodePackageManager.NPM
  ): NodePackageManager {
    return tryFindNodePackage(project, true)?.packageManager || defaultValue;
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
     * Get command to run a package in a temporary environment from
     * package(s) that are installed before executing.
     */
    export function downloadExecPkg(
      packageManager: NodePackageManager,
      pkg: string | string[],
      ...args: string[]
    ): string {
      const _pkgs: string[] = (Array.isArray(pkg) ? pkg : [pkg]).map(
        (p) => `--package=${p}`
      );

      switch (packageManager) {
        case NodePackageManager.YARN2:
          return withArgs("yarn", [..._pkgs, "dlx", ...args]);
        case NodePackageManager.PNPM:
          return withArgs("pnpm", [..._pkgs, "dlx", ...args]);
        default:
          return withArgs("npx", [..._pkgs, ...args]);
      }
    }

    export function execInWorkspace(
      packageManager: NodePackageManager,
      packageName: string,
      ...args: string[]
    ) {
      switch (packageManager) {
        case NodePackageManager.YARN:
        case NodePackageManager.YARN2:
          return withArgs("yarn workspace", [packageName, ...args]);
        case NodePackageManager.PNPM:
          return withArgs("pnpm", [
            `--filter "${packageName}"`,
            "exec",
            ...args,
          ]);
        default:
          return withArgs("npx", ["-p", packageName, ...args]);
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
