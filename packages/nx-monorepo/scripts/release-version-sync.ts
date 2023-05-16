#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import * as fs from "fs-extra";
import { SemVer } from "semver";
import { createProjectGraphAsync } from "@nrwl/devkit";

/**
 * List of package.json properties that define dependencies to resolve.
 */
const DEPS_PROPS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]

/**
 * Resolve all local package versions across dependencies in the workspace
 * based on package.json versions.
 */
async function releaseVersionSync() {
  const graph = await createProjectGraphAsync();

  const versions: Map<string, SemVer> = new Map();

  // Resolve all node package versions
  for(const [name, node] of Object.entries(graph.nodes)) {
    const root = node.data.root;
    const pkgJsonPath = path.join(root, "package.json");
    if (await fs.pathExists(pkgJsonPath)) {
      const pkgJson = await fs.readJson(pkgJsonPath);
      versions.set(name, new SemVer(pkgJson.version));
    }
  }

  // Update all node package deps
  for(const [name, node] of Object.entries(graph.nodes)) {
    const root = node.data.root;
    const pkgJsonPath = path.join(root, "package.json");
    if (await fs.pathExists(pkgJsonPath)) {
      const pkgJson = await fs.readJson(pkgJsonPath);
      const deps = graph.dependencies[name].filter(dep => {
        return dep.type === "static" && versions.has(dep.target)
      }).map(d => d.target);

      let modified = false;

      for(const dep of deps) {
        const depVersion = versions.get(dep);
        if (depVersion) {
          for (const prop of DEPS_PROPS) {
            if (pkgJson[prop] && pkgJson[prop][dep]) {
              if (depVersion.major === 0) {
                pkgJson[prop][dep] = `^${depVersion.format()}`;
              } else {
                pkgJson[prop][dep] = `^${depVersion.major}.x`;
              }
              modified = true;
              console.log(`[${name}] ${prop} on ${dep} set to ${pkgJson[prop][dep]}`)
            }
          }
        }
      }

      modified && await fs.writeJson(pkgJsonPath, pkgJson, { spaces: 2 });
    }
  }
}

(async () => {
  await releaseVersionSync();
})();
