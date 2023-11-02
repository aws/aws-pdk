#!/usr/bin/env node
const path = require("node:path");
const fs = require("fs");
const execa = require("execa");
const { sync } = require("find-up");

process.argv.splice(0, 2);
const isSynth = process.argv.filter(p => !p.startsWith("--")).length === 0;

if (process.argv[0] == "new") {
  execa.commandSync(`npx --yes projen@latest new --from @aws/pdk ${process.argv.slice(1).join(" ")}`, { stdio: "inherit" });
  return;
} else if (process.argv[0] == "--version") {
    execa.commandSync(`echo ${JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"))).version}`, { stdio: "inherit", cwd: __dirname });
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
  const pkgMgrCmd = engines.pnpm ? "pnpm" : engines.yarn ? "yarn" : engines.bun ? "bun" : "npm run";
  execa.commandSync(`${pkgMgrCmd}${isSynth ? " default" : ""} ${process.argv.join(" ")}`, { stdio: "inherit" });
} else {
  execa.commandSync(`npx projen ${process.argv.join(" ")}`, { stdio: "inherit"});
}
