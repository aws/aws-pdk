#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import * as fs from "fs-extra";
import { execSync } from "node:child_process";
import { SemVer, inc } from "semver";
import { createProjectGraphAsync, workspaceRoot } from "@nrwl/devkit";

// File path where version details are written to for downstream tasks
const RELEASE_ENV = "dist/.release.env";

/**
 * Get root directory for project
 */
async function getProjectRoot(project: string): Promise<string> {
  const graph = await createProjectGraphAsync();
  return graph.nodes[project].data.root;
}

/**
 * Nx semver plugin does not respect 0.x breaking changes sticking on 0.x. To solve this,
 * if a project is `stable = false` in NxReleaseProject and new version is >0.x,
 * we overwrite the versioning applied by the plugin (tag, package.json, changelog).
 */
async function releaseVersionPost() {
  let [,,stableArg,projectName,version,tag,previousTag] = process.argv;
  const stable = stableArg === "true";
  const previousVersion = previousTag.replace(projectName + "-", "");

  // Manually handle prerelease (0.x) bumping - ignore breaking change major bump
  // Until https://github.com/jscutlery/semver/issues/658 is resolved
  if (!stable && new SemVer(version).major > 0) {
    const initial = { version, tag, previousTag} as const;

    const previous = new SemVer(previousVersion);
    if (previous.major !== 0) {
      throw new Error(`Package ${projectName} versioning is inconsistent with prerelease (0.x): ${previousVersion}`);
    }

    version = inc(previous, "minor")!;
    tag = tag.replace(initial.version, version);

    // replace tag
    execSync(`git tag -d ${initial.tag}`);
    execSync(`git tag ${tag}`);

    const projectRoot = path.join(workspaceRoot, await getProjectRoot(projectName));

    // patch the package.json version
    const pgkJsonPath = path.join(projectRoot, "package.json");
    const pkgJson = await fs.readJson(pgkJsonPath);
    pkgJson.version = version;
    await fs.writeJson(pgkJsonPath, pkgJson, { spaces: 2 });

    // patch the changelog
    const changeLogPath = path.join(projectRoot, "CHANGELOG.md");
    const changeLog = (await fs.readFile(changeLogPath)).toString();
    // ^# \[?\d+\.\d+\.\d+(-\w+)?\]?(\S+)? \(\d{4}-\d{2}-\d{2}\)$
    // # 1.0.0 (2023-05-22)
    // # [0.6.0](https://github.com/.../compare/@aws-prototyping-sdk/pdk-nag-0.5.0...@aws-prototyping-sdk/pdk-nag-0.6.0) (2023-05-18)
    const isoDate = new Date().toISOString().split("T")[0];
    const escapedInitialVersion = initial.version.replace(/\./g, "\\.");
    const headingPattern = new RegExp(`^# \\[?${escapedInitialVersion}\\]?(?:\\S+)? \\(${isoDate}\\)$`, "m");
    const preHeading = (changeLog.match(headingPattern) || [""])[0];
    const newHeading = preHeading.replace(new RegExp(escapedInitialVersion, "g"), version);

    await fs.writeFile(changeLogPath, changeLog.replace(
      preHeading,
      newHeading
    ));

    console.info(`[${projectName}] 🧪 Downgraded from ${initial.version}=>${version} to maintain prerelease (0.x)`);
  }

  // create the .release.env file that is used by downstream tasks
  const env = {
    RELEASE_PROJECT_NAME: projectName,
    RELEASE_VERSION: version,
    RELEASE_TAG: tag,
    RELEASE_PREVIOUS_TAG: previousTag,
    RELEASE_PREVIOUS_VERSION: previousVersion,
    RELEASE_STABLE: stable,
  }

  const envIni = Object.entries(env).map(([key, value]) => `${key}=${value}`).join("\n");

  await fs.writeFile(path.join(process.cwd(), RELEASE_ENV), envIni)
}

(async () => {
  await releaseVersionPost();
})();
