#!/usr/bin/env node
const path = require("node:path");
const fs = require("fs");
const execa = require("execa");
const { sync } = require("find-up");

process.argv.splice(0, 2);
const isSynth = process.argv.filter(p => !p.startsWith("--")).length === 0;
const isInstall = process.argv[0] === "install";

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


if (!fs.existsSync("package.json")) {
    execa.commandSync(`npx projen ${process.argv.join(" ")}`, { stdio: "inherit" });
} else if (engines) {
    let pkgMgrCmd = engines.pnpm ? "pnpm" : engines.yarn ? "yarn" : engines.bun ? `bun${isInstall ? '' : ' run'}` : "npm run";

    // deploy and upgrade are pnpm commands, but it's more likely users want to run the projen tasks
    // upgrade is also a yarn command, and there's no difference between running yarn deploy vs yarn run deploy
    if ((engines.pnpm || engines.yarn) && ["deploy", "upgrade"].includes(process.argv[0])) {
        pkgMgrCmd += " run";
    }
    execa.commandSync(`${pkgMgrCmd}${isSynth ? " default" : ""} ${process.argv.join(" ")}`, { stdio: "inherit" });
} else {
    console.error("Cannot run pdk command without engines being set in root package.json.");
    process.exit(1);
}
