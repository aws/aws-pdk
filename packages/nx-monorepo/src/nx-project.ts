/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, JsonFile, Project } from "projen";
import { NodeProject } from "projen/lib/javascript";
import { buildDownloadExecutableCommand } from "./nx-monorepo";

/**
 * Component which manged the project specific NX Config and is added to all NXMonorepo subprojects.
 *
 */
export class NxProject extends Component {
  /**
   * Retrieves an instance of NXProject if one is associated to the given project.
   *
   * @param project project instance.
   */
  static of(project: Project): NxProject | undefined {
    return project.components.find((c) => c instanceof NxProject) as
      | NxProject
      | undefined;
  }

  /**
   * List of implicit dependencies.
   *
   * @internal
   * @private
   */
  private readonly _implicitDependencies: string[] = [];

  constructor(project: Project) {
    super(project);
  }

  /**
   * Adds an implicit dependency between the dependant (this project) and dependee.
   *
   * @param dependee project to add the implicit dependency on.
   */
  public addImplicitDependency(dependee: Project | string) {
    this._implicitDependencies.push(
      dependee instanceof Project ? dependee.name : dependee
    );
  }

  /**
   * Generate a nx block in the package.json if this is a NodeProject. Otherwise generate a project.json with
   * the relevant NX configuration.
   */
  synthesize() {
    if (this.project instanceof NodeProject) {
      this._implicitDependencies.length > 0 &&
        this.project
          .tryFindObjectFile("package.json")
          ?.addOverride("nx.implicitDependencies", this._implicitDependencies);
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
      this._implicitDependencies.length > 0 &&
        projectJson.addOverride(
          "implicitDependencies",
          this._implicitDependencies
        );
      projectJson.addOverride(
        "targets",
        this.project.tasks.all.reduce(
          (p, c) => ({
            [c.name]: {
              executor: "nx:run-commands",
              options: {
                command: `${buildDownloadExecutableCommand(
                  (this.project.root as NodeProject).package.packageManager,
                  `projen ${c.name}`
                )}`,
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
