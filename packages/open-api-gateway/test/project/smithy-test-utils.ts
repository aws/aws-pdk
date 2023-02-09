/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs-extra";
import { Project } from "projen";
import { directorySnapshot } from "projen/lib/util/synth";

/**
 * Test utility for synthesizing smithy projects
 */
export const synthSmithyCodeProject = (project: Project) => {
  try {
    project.synth();
    return directorySnapshot(project.outdir, {
      // Ignore the .gradle folder which is created during smithy build and includes timestamps
      excludeGlobs: [
        "**/.gradle/**/*",
        "**/output/classpath.json",
        "**/output/**/model.json",
      ],
    });
  } finally {
    fs.removeSync(project.outdir);
  }
};
