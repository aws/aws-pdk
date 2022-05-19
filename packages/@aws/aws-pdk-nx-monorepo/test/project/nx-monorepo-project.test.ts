// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import { synthSnapshot } from "projen/lib/util/synth";
import { NxMonorepoProject, TargetDependencyProject } from "../../src/project";

describe("NX Monorepo Unit Tests", () => {
  it("Empty Monorepo", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Ignore Patterns", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "IgnorePatterns",
      nxIgnorePatterns: ["pattern1.txt", "**/foo.ts"],
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Target Dependencies", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "TargetDependencies",
      targetDependencies: {
        test: [
          { target: "test", projects: TargetDependencyProject.DEPENDENCIES },
        ],
        eslint: [{ target: "eslint", projects: TargetDependencyProject.SELF }],
      },
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Composite", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "Composite",
    });

    const tsProject = new TypeScriptProject({
      name: "ts-subproject",
      outdir: "packages/ts-subproject",
      parent: project,
      defaultReleaseBranch: "mainline",
    });

    new TypeScriptProject({
      name: "ts-subproject2",
      outdir: "packages/ts-subproject2",
      parent: project,
      defaultReleaseBranch: "mainline",
      devDeps: ["ts-subproject"],
    });

    const pyProject = new PythonProject({
      parent: project,
      outdir: "packages/py-subproject",
      authorEmail: "test@test.com",
      authorName: "test",
      moduleName: "py_subproject",
      name: "py-subproject",
      version: "0.0.0",
    });

    project.addImplicitDependency(tsProject, pyProject);

    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
