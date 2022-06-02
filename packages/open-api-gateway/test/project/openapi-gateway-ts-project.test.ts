// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fs from "fs-extra";
import { Project } from "projen";
import { directorySnapshot } from "projen/lib/util/synth";
import { ClientLanguage, OpenApiGatewayTsProject } from "../../src/project";

/**
 * Similar to projen's synthSnapshot, but ignores node_modules and yarn.lock
 */
const synthSnapshot = (project: Project) => {
  const ENV_PROJEN_DISABLE_POST = process.env.PROJEN_DISABLE_POST;
  try {
    process.env.PROJEN_DISABLE_POST = "true";
    project.synth();
    return directorySnapshot(project.outdir, {
      excludeGlobs: ["**/node_modules/**", "**/yarn.lock"],
    });
  } finally {
    fs.removeSync(project.outdir);

    if (ENV_PROJEN_DISABLE_POST === undefined) {
      delete process.env.PROJEN_DISABLE_POST;
    } else {
      process.env.PROJEN_DISABLE_POST = ENV_PROJEN_DISABLE_POST;
    }
  }
};

describe("OpenAPI Gateway Ts Unit Tests", () => {
  it("Defaults", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [ClientLanguage.TYPESCRIPT],
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Without Sample Code", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [ClientLanguage.TYPESCRIPT],
      sampleCode: false,
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
