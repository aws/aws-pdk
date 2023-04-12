/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, JsonFile, Project } from "projen";
import { NodeProject } from "projen/lib/javascript";
import { buildExecutableCommand } from "./nx-monorepo";

export class NxProject extends Component {
  static of(project: Project): NxProject {
    return project.components.find((c) => c instanceof NxProject) as NxProject;
  }

  private readonly implicitDependencies: string[] = [];
  constructor(project: Project) {
    super(project);
  }

  public addImplicitDependency(dependee: Project | string) {
    this.implicitDependencies.push(
      dependee instanceof Project ? dependee.name : dependee
    );
  }

  synthesize() {
    if (this.project instanceof NodeProject) {
      this.project
        .tryFindObjectFile("package.json")
        ?.addOverride("nx.implicitDependencies", this.implicitDependencies);
    } else {
      const projectJson =
        this.project.tryFindObjectFile("project.json") ||
        new JsonFile(this.project, "project.json", {
          readonly: true,
          marker: true,
          obj: {},
        });

      const projectPath = path.relative(
        this.project.root.outdir,
        this.project.outdir
      );
      projectJson.addOverride("name", this.project.name);
      projectJson.addOverride("root", projectPath);
      projectJson.addOverride(
        "implicitDependencies",
        this.implicitDependencies
      );
      projectJson.addOverride(
        "targets",
        this.project.tasks.all.reduce(
          (p, c) => ({
            [c.name]: {
              executor: "nx:run-commands",
              options: {
                command: `${buildExecutableCommand(
                  (this.project.root as NodeProject).package.packageManager
                )} projen ${c.name}`,
                cwd: projectPath,
              },
            },
            ...p,
          }),
          {}
        )
      );
    }
    super.synthesize();
  }
}
