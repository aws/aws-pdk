// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fs from "fs";
import * as path from "path";
import { IgnoreFile, JsonFile, Project } from "projen";
import { NodeProject } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";

export interface NxMonorepoProjectOptions extends TypeScriptProjectOptions {}

/**
 * @pjid nx-monorepo
 */
export class NxMonorepoProject extends TypeScriptProject {
  private readonly implicitDependencies: { [pkg: string]: string[] } = {};

  constructor(options: NxMonorepoProjectOptions) {
    super({
      ...options,
      github: false,
      jest: false,
      package: false,
      prettier: true,
      projenrcTs: true,
      release: false,
      sampleCode: false,
      name: "monorepo",
      defaultReleaseBranch: "mainline",
    });

    // Never publish a monorepo root package.
    this.package.addField("private", true);

    // No need to compile or test a monorepo root package.
    this.compileTask.reset();
    this.testTask.reset();

    this.addDevDeps("aws-pdk", "@nrwl/cli", "@nrwl/workspace");

    new IgnoreFile(this, ".nxignore").exclude(
      "test-reports",
      "target",
      ".env",
      ".pytest_cache"
    );

    new JsonFile(this, "nx.json", {
      obj: {
        extends: "@nrwl/workspace/presets/npm.json",
        npmScope: "monorepo",
        tasksRunnerOptions: {
          default: {
            runner: "@nrwl/workspace/tasks-runners/default",
            options: {
              useDaemonProcess: false,
              cacheableOperations: ["build", "test"],
            },
          },
        },
        targetDependencies: {
          build: [
            {
              target: "build",
              projects: "dependencies",
            },
          ],
          test: [
            {
              target: "test",
              projects: "dependencies",
            },
          ],
        },
        affected: {
          defaultBase: "mainline",
        },
      },
    });
  }

  public addImplicitDependency(dependent: Project, dependee: Project) {
    if (this.implicitDependencies[dependent.name]) {
      this.implicitDependencies[dependent.name].push(dependee.name);
    } else {
      this.implicitDependencies[dependent.name] = [dependee.name];
    }
  }

  // Remove this hack once subProjects is made public in Projen
  private get subProjects(): Project[] {
    // @ts-ignore
    const subProjects: Project[] = this.subprojects || [];
    return subProjects.sort((a, b) => a.name.localeCompare(b.name));
  }

  preSynthesize() {
    super.preSynthesize();

    const subProjectLocations: { [pkg: string]: string } = {};
    this.subProjects.forEach((subProject) => {
      subProjectLocations[subProject.name] = path.relative(
        this.outdir,
        subProject.outdir
      );

      if (subProject instanceof NodeProject) {
        if (this.implicitDependencies[subProject.name]) {
          subProject.package.addField("nx", {
            implicitDependencies: this.implicitDependencies[subProject.name],
          });
        }
      } else {
        if (fs.existsSync(subProject.outdir)) {
          // generate a package.json if not found
          const manifest: any = {};
          manifest.name = subProject.name;
          manifest.scripts = subProject.tasks.all.reduce(
            (p, c) => ({
              [c.name]: `npx projen ${c.name}`,
              ...p,
            }),
            {}
          );
          manifest.version = "0.0.0";

          if (this.implicitDependencies[subProject.name]) {
            manifest.nx = {
              implicitDependencies: this.implicitDependencies[subProject.name],
            };
          }

          new JsonFile(subProject, "package.json", {
            obj: manifest,
            readonly: true,
          });
        }
      }
    });

    // Add workspaces for each subproject
    this.package.addField("workspaces", Object.values(subProjectLocations));
  }
}
