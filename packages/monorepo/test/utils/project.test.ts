/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { NodeProject } from "projen/lib/javascript";
import { IPythonDeps, Poetry, PythonProject } from "projen/lib/python";
import { MonorepoTsProject } from "../../lib";
import { ProjectUtils } from "../../src";

describe("ProjectUtils", () => {
  it("should determine whether an object instance is an instance of a given parent class", () => {
    // Project is a Project
    expect(
      ProjectUtils.isNamedInstanceOf(new Project({ name: "test" }), Project)
    ).toBe(true);

    // NodeProject is a Project
    expect(
      ProjectUtils.isNamedInstanceOf(
        new NodeProject({ name: "test", defaultReleaseBranch: "test" }),
        Project as any
      )
    ).toBe(true);

    // NodeProject is a NodeProject
    expect(
      ProjectUtils.isNamedInstanceOf(
        new NodeProject({ name: "test", defaultReleaseBranch: "test" }),
        NodeProject
      )
    ).toBe(true);

    // PythonProject is not a NodeProject
    expect(
      ProjectUtils.isNamedInstanceOf(
        new PythonProject({
          authorEmail: "test",
          authorName: "test",
          moduleName: "test",
          name: "test",
          version: "1.0.0",
        }),
        NodeProject as any
      )
    ).toBe(false);

    // MonorepoTsProject is a MonorepoTsProject
    expect(
      ProjectUtils.isNamedInstanceOf(
        new MonorepoTsProject({ name: "test", defaultReleaseBranch: "test" }),
        MonorepoTsProject
      )
    ).toBe(true);

    // Project (MonorepoTsProject) is a MonorepoTsProject
    const pNx: Project = new MonorepoTsProject({
      name: "test",
      defaultReleaseBranch: "test",
    });
    expect(ProjectUtils.isNamedInstanceOf(pNx, MonorepoTsProject)).toBe(true);

    // Project (NodeProject) is not a MonorepoTsProject
    const pNode: Project = new NodeProject({
      name: "test",
      defaultReleaseBranch: "test",
    });
    expect(ProjectUtils.isNamedInstanceOf(pNode, MonorepoTsProject)).toBe(
      false
    );

    // Component cast to interface, then any
    const poetry: IPythonDeps = new Poetry(new Project({ name: "test" }), {
      authorEmail: "test",
      authorName: "test",
      version: "1.0.0",
    });
    expect(ProjectUtils.isNamedInstanceOf(poetry as any, Poetry)).toBe(true);
  });
});
