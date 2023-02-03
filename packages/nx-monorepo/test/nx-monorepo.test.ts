/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodePackageManager } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import { synthSnapshot } from "projen/lib/util/synth";
import { NxMonorepoProject, Nx } from "../src";

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
            {
              target: "test",
              projects: Nx.TargetDependencyProject.DEPENDENCIES,
            },
          ],
          eslint: [
            { target: "eslint", projects: Nx.TargetDependencyProject.SELF },
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

  it.each([NodePackageManager.PNPM, NodePackageManager.YARN])(
    "Additional Workspace Packages",
    (packageManager) => {
      const project = new NxMonorepoProject({
        defaultReleaseBranch: "mainline",
        packageManager,
        name: "AdditionalWorkspacePackages",
        workspaceConfig: {
          additionalPackages: ["my/custom/package"],
        },
      });
      new TypeScriptProject({
        name: "ts-subproject",
        outdir: "packages/ts-subproject",
        parent: project,
        packageManager,
        defaultReleaseBranch: "mainline",
      });
      project.addWorkspacePackages(
        "another/custom/package",
        "yet/another/package"
      );
      expect(synthSnapshot(project)).toMatchSnapshot();
    }
  );

  it("Workspace Package Order", () => {
    const project = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "WorkspacePackageOrder",
      workspaceConfig: {
        additionalPackages: ["packages/one"],
      },
    });
    new TypeScriptProject({
      name: "two",
      outdir: "packages/two",
      parent: project,
      defaultReleaseBranch: "mainline",
    });
    project.addWorkspacePackages("packages/three", "packages/four");
    new TypeScriptProject({
      name: "five",
      outdir: "packages/five",
      parent: project,
      defaultReleaseBranch: "mainline",
    });
    project.addWorkspacePackages("packages/six");
    new TypeScriptProject({
      name: "seven",
      outdir: "packages/seven",
      parent: project,
      defaultReleaseBranch: "mainline",
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
