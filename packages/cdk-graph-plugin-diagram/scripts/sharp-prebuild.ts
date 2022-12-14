#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import * as fs from "fs-extra";
import execa = require("execa");

// https://sharp.pixelplumbing.com/install#cross-platform
interface SharpPrebuild {
  readonly platform: "linux" | "darwin" | "win32";
  readonly arch: "x64" | "ia32" | "arm" | "arm64";
  // (arm defaults to 6, arm64 defaults to 8).
  readonly armVersion?: 6 | 7 | 8;
  // This option only works with platform linux, defaults to glibc
  readonly libc?: "glibc" | "musl";
  readonly force?: boolean;
}

// https://github.com/lovell/sharp/blob/0f1e7ef6f6e9097c481dbbf35b091bf92fcc3fed/install/libvips.js#L26-L35
// https://github.com/lovell/sharp-libvips/releases/v8.13.3/
const SHARP_PREBUILDS: Record<string, SharpPrebuild> = {
  "darwin-x64": {
    platform: "darwin",
    arch: "x64",
  },
  "darwin-arm64": {
    platform: "darwin",
    arch: "arm64",
  },
  "linux-arm64": {
    platform: "linux",
    arch: "arm64",
  },
  "linux-x64": {
    platform: "linux",
    arch: "x64",
  },
  "linuxmusl-x64": {
    platform: "linux",
    arch: "x64",
    libc: "musl",
  },
  "linuxmusl-arm64": {
    platform: "linux",
    arch: "arm64",
    libc: "musl",
  },
  "win32-ia32": {
    platform: "win32",
    arch: "ia32",
  },
  "win32-x64": {
    platform: "win32",
    arch: "x64",
  }
};

(async () => {
  for (const [name, prebuild] of Object.entries(SHARP_PREBUILDS)) {
    const { platform, arch, armVersion, libc, force } = prebuild;
    let cmd = `npm rebuild --platform=${platform} --arch=${arch}`;

    if (armVersion) {
      cmd += ` --arm-version=${armVersion}`;
    }

    if (libc) {
      cmd += ` --libc=${libc}`;
    }

    if (force) {
      cmd += ` --sharp-install-force`;
    }

    console.log(`sharp:prebuild: "${name}"`, prebuild);

    await execa.command(`${cmd} sharp`, { stdio: "inherit", cwd: __dirname })
  }

  const sharpModule = require.resolve("sharp").replace(/sharp\/.*/, "sharp");
  const vendorDir = path.join(sharpModule, "vendor");

  // Replace all hard links with copy
  // npm ERR! 415 Unsupported Media Type - PUT ... - Hard link is not allowed
  const hardLinks = await findHardlinks(vendorDir);
  console.debug("sharp hardlinks:", hardLinks.length, hardLinks);
  // Find all same files (matching hard links)
  const matchedFiles = new Set<string>();
  const sameFiles: string[][] = [];
  for (const hardlink of hardLinks) {
    if (!matchedFiles.has(hardlink)) {
      const _sameFiles = await findSameFiles(vendorDir, hardlink);
      _sameFiles.forEach((f) => matchedFiles.add(f));
      sameFiles.push(_sameFiles);
    }
  }
  // Replace hard links with copies
  for (const group of sameFiles) {
    const [source, ...copies] = group;
    for (const copy of copies) {
      // Must delete hard link first other ways is considered same file during copy
      await fs.rm(path.join(vendorDir, copy), { recursive: true });
      await fs.copy(path.join(vendorDir, source), path.join(vendorDir, copy), { overwrite: true, recursive: true, errorOnExist: true });
    }
  }

  // Ensure there are no more hard links
  const remainingHardLinks = await findHardlinks(vendorDir);
  if (remainingHardLinks.length) {
    console.debug(remainingHardLinks);
    throw new Error("Hard links still exist in sharp prebuild - this will cause publishing error in npm")
  }
})();

async function findHardlinks (dir: string): Promise<string[]> {
  return (await execa.command("find . -type f \! -links 1", { cwd: dir }))
  .stdout
  .split("\n")
  .filter((v) => v != null && v.length);
}

async function findSameFiles (cwd: string, file: string): Promise<string[]> {
  return (await execa.command(`find . -samefile ${file}`, { cwd }))
  .stdout
  .split("\n")
  .filter((v) => v != null && v.length);
}
