/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import * as fs from "fs-extra";
import { Project } from "projen";
import { directorySnapshot } from "projen/lib/util/synth";
import { ParsedSpec } from "../../../../src/project/spec/components/parsed-spec";

/**
 * Test utility for synthesizing generated code
 */
export const synthGeneratedCodeProject = (
  specFileName: string,
  project: Project,
  addGeneratedCodeToProject: (specPath: string) => void
) => {
  try {
    const parsedSpecPath = path.join(project.outdir, "spec.json");
    new ParsedSpec(project, {
      specPath: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "resources",
        "specs",
        specFileName
      ),
      outputPath: parsedSpecPath,
    });
    addGeneratedCodeToProject(parsedSpecPath);
    project.synth();
    return directorySnapshot(project.outdir, {
      excludeGlobs: ["**/spec.json"],
    });
  } finally {
    fs.removeSync(project.outdir);
  }
};
