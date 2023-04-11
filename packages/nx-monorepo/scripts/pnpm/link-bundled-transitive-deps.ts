#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import * as fs from "fs-extra";
import { Lockfile, ResolvedDependencies } from "@pnpm/lockfile-types";
import * as SemVer from "semver";

function resolvePnpmPath(workspaceDir: string, name: string, version: string) {
  return path.join(workspaceDir, "node_modules", ".pnpm", `${name.replace("/", "+") }@${version}`, "node_modules", name);
}

async function linkBundledTransitiveDeps(workspaceDir: string, pkgFolder: string, lockfile?: Lockfile) {
  const pkgDir = path.join(workspaceDir, pkgFolder);
  const pkgJson = require(path.join(pkgDir, "package.json"));
  const bundledDeps: string[] = pkgJson.bundledDependencies || [];
  if (bundledDeps.length < 1) {
    // No bundled deps
    return;
  }

  if (lockfile == null) {
    require("@pnpm/logger").default = () => {};
    lockfile = await (require("@pnpm/lockfile-file")).readWantedLockfile(workspaceDir, { ignoreIncompatible: true });

    if (lockfile == null) {
      throw new Error("Failed to read lockfile")
    }
  }

  const pkgDeps = lockfile.importers[pkgFolder].dependencies!;

  const transitiveDeps: Record<string, { version: string, path: string }> = {};

  function visit(_deps?: ResolvedDependencies) {
    if (_deps == null) {
      return;
    }

    Object.entries(_deps).forEach(([name, version]) => {
      // record the transitive dep with resolved path to symlink
      const _existing = transitiveDeps[name];
      // Use the latest version of transitive deps only
      // TODO: Can we support multiple versions of transitive deps, and should we?
      if (!_existing || SemVer.gt(version, _existing.version)) {
        transitiveDeps[name] = { version, path: resolvePnpmPath(workspaceDir, name, version) };

        // traverse
        visit(lockfile!.packages![`/${name}/${version}`]!.dependencies)
      }
    })
  }

  for (const _bundledDep of bundledDeps) {
    const _resolvedVersion = pkgDeps[_bundledDep];
    if (_resolvedVersion == null) {
      throw new Error(`Package ${pkgJson.name} bundled dependency "${_bundledDep}" is missing dependency declaration.`)
    }

    const _lockPkgKey = `/${_bundledDep}/${_resolvedVersion}`;
    const _transitivePkg = lockfile.packages![_lockPkgKey];
    if (_transitivePkg == null) {
      console.log(lockfile.packages);
      console.log(_lockPkgKey);
      throw new Error(`Transitive package ${_bundledDep} is missing lockfile package declaration`)
    }
    visit(_transitivePkg.dependencies);
  }

  // create symlink for each transitive dep in package node_modules
  for (const [name, dep] of Object.entries(transitiveDeps)) {
    const _dest = path.join(pkgDir, "node_modules", name);
    if (!(await fs.pathExists(_dest))) {
      await fs.ensureSymlink(dep.path, _dest, "dir");
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
