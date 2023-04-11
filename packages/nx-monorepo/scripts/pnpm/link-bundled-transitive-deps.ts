#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import * as child_process from "node:child_process";
import { promisify } from "node:util";
import * as fs from "fs-extra";
import * as SemVer from "semver";

interface Dependency {
  readonly from: string;
  readonly version: string;
  readonly resolved?: string;
  readonly path: string;
  readonly dependencies?: Record<string, Dependency>;
}

interface PackageTree {
  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly private?: boolean;
  readonly dependencies?: Record<string, Dependency>;
}

type PnpmListJson = PackageTree[];

async function linkBundledTransitiveDeps(workspaceDir: string, pkgFolder: string) {
  const pkgDir = path.join(workspaceDir, pkgFolder);
  const pkgJson = require(path.join(pkgDir, "package.json"));
  const bundledDeps: string[] = pkgJson.bundledDependencies || [];
  if (bundledDeps.length < 1) {
    // No bundled deps
    return;
  }

  const listJson: PnpmListJson = JSON.parse((await promisify(child_process.exec)(`pnpm list --depth 10000 --prod --no-optional --json`, { cwd: pkgDir })).stdout);
  const pkgTree: PackageTree | undefined = listJson.find((v) => v.name === pkgJson.name);
  if (pkgTree == null || pkgTree.dependencies == null) {
    throw new Error(`Failed to list pnpm dependencies for package: ${pkgFolder}`);
  }

  const transitiveDeps: Record<string, Dependency> = {};

  function visit(_deps?: Record<string, Dependency>) {
    if (_deps == null || !Object.values(_deps).length) {
      return;
    }

    Object.entries(_deps).forEach(([_key, _dep]) => {
      if (_dep.resolved == null || _dep.version.startsWith("link:")) {
        // Unresolved / unsaved dependency
        return;
      }

      // record the transitive dep with resolved path to symlink
      const _existing = transitiveDeps[_dep.from];
      // Use the latest version of transitive deps only
      // TODO: Can we support multiple versions of transitive deps, and should we?
      if (!_existing || SemVer.gt(_dep.version, _existing.version)) {
        transitiveDeps[_dep.from] = _dep;

        // traverse
        visit(_dep.dependencies);
      }
    })
  }

  for (const _bundledDepName of bundledDeps) {
    const _bundledDep = pkgTree.dependencies[_bundledDepName] || Object.values(pkgTree.dependencies).find((v) => v.from === _bundledDepName);
    if (_bundledDep == null) {
      throw new Error(`Package ${pkgJson.name} bundled dependency "${_bundledDepName}" is missing dependency declaration.`)
    }

    visit(_bundledDep.dependencies);
  }

  // create symlink for each transitive dep in package node_modules
  for (const [name, dep] of Object.entries(transitiveDeps)) {
    const _dest = path.join(pkgDir, "node_modules", name);
    if (!(await fs.pathExists(_dest))) {
      if (!(await fs.pathExists(dep.path))) {
        console.warn(dep);
        throw new Error(`Pnpm dependency path not found: ${dep.path}`);
      }

      await fs.createSymlink(dep.path, _dest, "dir");
    }
  }

  console.info(`Package "${pkgFolder}" transitive bundled dependencies are linked:`, Object.keys(transitiveDeps).sort().join(", "));
}

(async () => {
  const [,,pkgFolder] = process.argv;

  if (pkgFolder == null) {
    throw new Error(`Missing pkgDir arg`)
  }

  linkBundledTransitiveDeps(
    require("nx/src/utils/workspace-root").workspaceRoot,
    pkgFolder,
  )
})();
