#!/usr/bin/env node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/* eslint-disable import/no-extraneous-dependencies */
const { createHash } = require("node:crypto");
const { readdirSync, statSync } = require("node:fs");
const path = require("node:path");
const { FileHasherBase } = require("nx/src/hasher/file-hasher-base");
const { workspaceRoot } = require("nx/src/utils/workspace-root");

class DirHasher extends FileHasherBase {
  async init() {
    this.clear();
    this.isInitialized = true;
  }

  hashDir(absoluteDirName, recurse = true, _record = new Map()) {
    try {
      readdirSync(absoluteDirName).forEach((c) => {
        const absoluteChild = path.join(absoluteDirName, c);
        const relChild = path.relative(absoluteDirName, absoluteChild);

        try {
          const s = statSync(absoluteChild);
          if (s.isFile()) {
            _record.set(path.normalize(relChild), this.hashFile(absoluteChild));
          } else if (s.isDirectory() && recurse) {
            this.hashDir(absoluteChild, true, _record);
          }
        } catch {}
      });
    } catch {}

    return _record;
  }

  async hashFiles(files) {
    const r = new Map();

    for (let f of files) {
      r.set(f, this.hashFile(f));
    }

    return r;
  }
}

(async () => {
  let dir = process.argv[2];
  if (dir == null || dir === "" || !dir.startsWith("{workspaceRoot}")) {
    throw new Error(
      "monorepo.nx-dir-hasher: requires path to directory to hash beginning with {workspaceRoot} (eg: `monorepo.nx-dir-hasher {workspaceRoot}/dir/to/hash`)"
    );
  }
  if (dir.startsWith("{workspaceRoot}")) {
    dir = dir.replace("{workspaceRoot}", workspaceRoot);
  }
  if (!path.isAbsolute(dir)) {
    dir = path.join(workspaceRoot, dir);
  }
  const hasher = new DirHasher();
  await hasher.init();
  const fileHashes = JSON.stringify(
    Object.fromEntries(hasher.hashDir(dir).entries())
  );
  console.log(createHash("md5").update(fileHashes).digest("hex"));
})();
