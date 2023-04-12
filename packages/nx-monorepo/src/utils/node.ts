/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { NodePackage, NodePackageManager } from "projen/lib/javascript";

/** @experimental */
export namespace NodePackageUtils {
  function withArgs(cmd: string, args: string[]): string {
    if (args.length) {
      return `${cmd} ${args.join(" ")}`;
    }

    return cmd;
  }

  export function findNodePackage(project: Project): NodePackage {
    const nodePackage = tryFindNodePackage(project);
    if (nodePackage) {
      return nodePackage;
    }
    throw new Error(
      `Project ${project.name} does not have NodePackage component.`
    );
  }

  export function tryFindNodePackage(
    project: Project
  ): NodePackage | undefined {
    let _project: Project | undefined = project;
    while (_project) {
      const nodePackage = _project.components.find(
        (c) => c instanceof NodePackage
      ) as NodePackage | undefined;
      if (nodePackage) {
        return nodePackage;
      }
      _project = _project.parent;
    }
    return undefined;
  }

  export function taskCommand(project: Project, ...args: string[]): string {
    switch (findNodePackage(project).packageManager) {
      case NodePackageManager.YARN:
      case NodePackageManager.YARN2:
        return withArgs("yarn", args);
      case NodePackageManager.PNPM:
        return withArgs("pnpm", args);
      default:
        return withArgs("npm", args);
    }
  }

  export function executableCommand(
    project: Project,
    ...args: string[]
  ): string {
    switch (findNodePackage(project).packageManager) {
      case NodePackageManager.YARN:
      case NodePackageManager.YARN2:
        return withArgs("yarn", args);
      case NodePackageManager.PNPM:
        return withArgs("pnpx", args);
      default:
        return withArgs("npx", args);
    }
  }

  export function binCommand(project: Project): string {
    switch (findNodePackage(project).packageManager) {
      case NodePackageManager.YARN:
      case NodePackageManager.YARN2:
        return "yarn bin";
      case NodePackageManager.PNPM:
        return "pnpm bin";
      default:
        return "npm bin";
    }
  }
}
