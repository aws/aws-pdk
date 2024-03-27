/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import * as fs from "fs-extra";
import { Project } from "projen";
import {
  directorySnapshot,
  DirectorySnapshotOptions,
} from "projen/lib/util/synth";

export const SMITHY_EXCLUDE_GLOBS = [
  "**/gradle/wrapper/**/*",
  "**/gradlew",
  "**/gradlew.bat",
];

/**
 * Test utility for synthesizing smithy projects
 */
export const synthSmithyProject = (project: Project) => {
  return synthProject(project, SMITHY_EXCLUDE_GLOBS);
};

/**
 * Synthesize a project for testing
 */
export const synthProject = (project: Project, excludeGlobs?: string[]) => {
  try {
    project.synth();
    return directorySnapshot(project.outdir, {
      excludeGlobs,
    });
  } finally {
    fs.removeSync(project.outdir);
  }
};

/**
 * Create a temporary directory relative to the given base path, and snapshot it after executing
 * the given function. Always cleans up the temporary dir.
 */
export const withTmpDirSnapshot = (
  basePath: string,
  fn: (tmpDir: string) => void | DirectorySnapshotOptions,
  options?: DirectorySnapshotOptions
) => {
  const tmpDir = fs.mkdtempSync(path.join(basePath, "tmp."));
  try {
    const opts = fn(tmpDir);
    return directorySnapshot(tmpDir, opts ?? options);
  } finally {
    fs.removeSync(tmpDir);
  }
};
