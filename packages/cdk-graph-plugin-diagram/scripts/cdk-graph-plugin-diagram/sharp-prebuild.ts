#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
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

  // Ensure vendor and build folders are included in bundle!
  // https://github.blog/changelog/2022-10-24-npm-v9-0-0-released/#%E2%9A%A0%EF%B8%8F-notable-breaking-changes
  const sharpPackageJson = `${require.resolve("sharp").replace(/sharp\/.*/, "sharp")}/package.json`;
  const sharpPackage =  fs.readJsonSync(sharpPackageJson);
  fs.writeJsonSync(sharpPackageJson, {...sharpPackage, files: Array.from(new Set([...sharpPackage.files, 'build/**', 'vendor/**']))}, {spaces: 2});
})();
