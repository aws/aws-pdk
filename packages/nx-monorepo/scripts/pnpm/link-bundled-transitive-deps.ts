#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import * as fs from "fs-extra";
import {
  buildDependenciesHierarchy,
  PackageNode,
} from "@pnpm/reviewing.dependencies-hierarchy";

async function linkBundledTransitiveDeps(
  workspaceDir: string,
  pkgFolder: string
) {
  const pkgDir = path.join(workspaceDir, pkgFolder);
  const pkgJson = require(path.join(pkgDir, "package.json"));
  const bundledDeps: string[] = pkgJson.bundledDependencies || [];
  if (!bundledDeps.length) {
    // No bundled deps
    return;
  }

  const dependencyHierarchy = (
    await buildDependenciesHierarchy([pkgDir], {
      depth: Number.MAX_SAFE_INTEGER,
      lockfileDir: workspaceDir,
      include: {
        optionalDependencies: false,
        dependencies: true,
        devDependencies: false,
      },
    })
  )[pkgDir];
  const transitiveDeps: Record<string, PackageNode & { depth: number }> = {};

  function visit(_deps?: PackageNode[], depth: number = 0) {
    if (_deps == null || !_deps.length) {
      return;
    }

    _deps.forEach((_dep) => {
      if (
        _dep.resolved == null ||
        _dep.isMissing ||
        _dep.version.startsWith("link:")
      ) {
        // Unresolved / unsaved dependency
        return;
      }

      // record the transitive dep with resolved path to symlink
      const _existing = transitiveDeps[_dep.alias];
      // Use the latest version of transitive deps only
      // TODO: Can we support multiple versions of transitive deps, and should we?
      if (!_existing || depth < _existing.depth) {
        transitiveDeps[_dep.alias] = { ..._dep, depth };

        // traverse
        visit(_dep.dependencies, depth + 1);
      }
    });
  }

  for (const _bundledDepName of bundledDeps) {
    const _bundledDep = (dependencyHierarchy.dependencies || []).find(
      (v) => v.alias === _bundledDepName
    );
    if (_bundledDep == null) {
      throw new Error(
        `Package ${pkgJson.name} bundled dependency "${_bundledDepName}" is missing dependency declaration.`
      );
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

  console.info(
    `Package "${pkgFolder}" transitive bundled dependencies are linked:`,
    Object.keys(transitiveDeps).sort().join(", ")
  );
}

(async () => {
  const [, , pkgFolder] = process.argv;

  if (pkgFolder == null) {
    throw new Error(`Missing pkgDir arg`);
  }

  linkBundledTransitiveDeps(
    require("nx/src/utils/workspace-root").workspaceRoot,
    pkgFolder
  );
})();
