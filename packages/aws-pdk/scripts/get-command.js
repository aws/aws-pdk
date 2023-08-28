#!/usr/bin/env node
const path = require("node:path");
const fs = require("fs");
const { sync } = require("find-up");

const isSynth = process.argv.length === 2;

if (process.argv[2] == "new") {
  console.log("npx --yes projen@latest --from aws-pdk");
  return;
}

const nxDir = sync("nx.json");

if (!nxDir) {
  console.error("Cannot run pdk command as you are not in a pdk monorepo.");
  process.exit(1);
}
const rootDir = nxDir.replace("nx.json", "");
const engines = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"))
).engines;

if (engines) {
  const pkgMgr = engines.pnpm ? "pnpm" : engines.yarn ? "yarn" : "npm";
  console.log(`${pkgMgr}${isSynth ? " projen" : ""}`);
} else {
  console.log("npx projen");
}
