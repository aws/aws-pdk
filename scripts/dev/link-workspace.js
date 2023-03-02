#!/usr/bin/env node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
const path = require("node:path");
const fs = require("fs-extra");
const execa = require("execa");

/*
This script links (or unlinks) CDK modules and workspace packages in yarn global via `yarn link`.

This enables using local development version of aws-prototyping-sdk during development
of other projects outside of this workspace.

By passing `unlink` as first arg it will unlink, otherwise will link.
*/

const MODULES_TO_LINK = [
  "constructs",
  "aws-cdk-lib",
];

const NODE_MODULES_DIR = path.join(__dirname, '../..', 'node_modules');

const PACKAGES_DIR = path.join(__dirname, '../..', 'packages');

async function getPackageName(dir) {
  return require(path.join(dir, "package.json")).name;
}

(async () => {
  const linked = [];

  const cmd = "yarn " + (process.argv[2] || "link");

  for(const mdl of MODULES_TO_LINK) {
    const dir = path.join(NODE_MODULES_DIR, mdl);
    const pkgName = await getPackageName(dir);
    try {
      await execa.command(cmd, { cwd: dir, stdio: "inherit" });
    } catch {}
    linked.push(pkgName);
  };

  for(const pkg of (await fs.readdir(PACKAGES_DIR, { withFileTypes: true }))) {
    if (pkg.isDirectory() && await fs.pathExists(path.join(PACKAGES_DIR, pkg.name, "package.json"))) {
      const dir = path.join(PACKAGES_DIR, pkg.name);
      const pkgName = await getPackageName(dir);
      try {
        await execa.command(cmd, { cwd: dir, stdio: "inherit" });
      } catch {}
      linked.push(pkgName);
    }
  }

  console.log("\n\n");
  console.log(`You can now run \`${cmd} ${linked.map(v => `"${v}"`).join(" ")}\` in the projects where you want to use these package and it will be used instead.`);
})();
