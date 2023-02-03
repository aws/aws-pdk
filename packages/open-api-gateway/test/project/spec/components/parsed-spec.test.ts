/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import * as fs from "fs-extra";
import { Project } from "projen";
import { directorySnapshot } from "projen/lib/util/synth";
import { ParsedSpec } from "../../../../src/project/spec/components/parsed-spec";

const synthParsedSpec = (specFileName: string) => {
  const project = new Project({
    name: "test",
  });
  try {
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
      outputPath: path.join(project.outdir, "spec.json"),
    });
    project.synth();
    return directorySnapshot(project.outdir);
  } finally {
    fs.removeSync(project.outdir);
  }
};

describe("Parsed Spec Unit Tests", () => {
  it("Single", () => {
    expect(synthParsedSpec("single.yaml")).toMatchSnapshot();
  });

  it("Multi", () => {
    expect(synthParsedSpec("multi.yaml")).toMatchSnapshot();
  });
});
