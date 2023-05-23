#!/usr/bin/env node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
const { execSync } = require("node:child_process");
const { readFileSync } = require("node:fs");

const BREAKING_PATTERN = /BREAKING CHANGE/gmi;
const PROJECT_PATTERN = /^packages\/([^/]+)\//

// Enforce that only 1 package is modified for breaking change commits.
function enforce(commitMsgFile) {
  const message = readFileSync(commitMsgFile).toString();

  if (BREAKING_PATTERN.test(message)) {
    const files = String(execSync("git diff --name-only --staged")).split("\n");
    const modifiedProjects = new Set();
    files.forEach((file) => {
      const match = PROJECT_PATTERN.exec(file);
      if (match && match[1]) {
        modifiedProjects.add(match[1]);
      }
    })

    if (modifiedProjects.size > 1) {
      console.error("\x1b[31m 🛑 Breaking change commits must only modify a single project. \x1b[0m");
      console.error("\x1b[33m ⚠️ This commit modifies multiple projects: \x1b[0m", [...modifiedProjects]);
      console.error("\x1b[36m 🧐 Break the commit into multiple commits, with breaking changes isolated to explicit project files. \x1b[0m")
      process.exit(modifiedProjects.size);
    } else {
      process.exit(0);
    }
  }

  process.exit(0);
}

enforce(process.argv[2]);
