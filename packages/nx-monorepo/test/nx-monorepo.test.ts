/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

import { NodePackageManager } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import { synthSnapshot } from "projen/lib/util/synth";
import { NxMonorepoProject, TargetDependencyProject } from "../src";

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
      nxConfig: {
        nxIgnore: ["pattern1.txt", "**/foo.ts"],
      },
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Target Dependencies", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "TargetDependencies",
      nxConfig: {
        targetDependencies: {
          test: [
            { target: "test", projects: TargetDependencyProject.DEPENDENCIES },
          ],
          eslint: [
            { target: "eslint", projects: TargetDependencyProject.SELF },
          ],
        },
      },
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Affected Branch", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "main",
      name: "AffectedBranch",
      nxConfig: {
        affectedBranch: "main",
      },
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("PNPM", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "PNPM",
      packageManager: NodePackageManager.PNPM,
    });
    new TypeScriptProject({
      name: "ts-subproject",
      outdir: "packages/ts-subproject",
      parent: project,
      packageManager: NodePackageManager.PNPM,
      defaultReleaseBranch: "mainline",
    });

    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Validate consistent Package Managers", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "PNPM",
      packageManager: NodePackageManager.PNPM,
    });
    new TypeScriptProject({
      name: "ts-subproject",
      outdir: "packages/ts-subproject",
      parent: project,
      defaultReleaseBranch: "mainline",
    });

    expect(() => synthSnapshot(project)).toThrow(
      "ts-subproject packageManager does not match the monorepo packageManager: pnpm."
    );
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
