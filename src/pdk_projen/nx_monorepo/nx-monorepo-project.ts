// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fs from "fs";
import * as path from "path";
import { IgnoreFile, JsonFile, Project, TextFile } from "projen";
import { NodeProject } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";

const NX_MONOREPO_PLUGIN_PATH: string = ".nx/plugins/nx-monorepo-plugin.js";

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

    this.addDevDeps("aws-prototyping-sdk", "@nrwl/cli", "@nrwl/workspace");

    new IgnoreFile(this, ".nxignore").exclude(
      "test-reports",
      "target",
      ".env",
      ".pytest_cache"
    );

    new TextFile(this, NX_MONOREPO_PLUGIN_PATH, {
      readonly: true,
      lines: fs
        .readFileSync(
          "./node_modules/aws-prototyping-sdk/lib/pdk_projen/nx_monorepo/plugin/nx-monorepo-plugin.js"
        )
        .toString("utf-8")
        .split("\n"),
    });

    new JsonFile(this, "nx.json", {
      obj: {
        extends: "@nrwl/workspace/presets/npm.json",
        plugins: [`./${NX_MONOREPO_PLUGIN_PATH}`],
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
        implicitDependencies: this.implicitDependencies,
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

    // Add workspaces for each subproject
    this.package.addField(
      "workspaces",
      this.subProjects.map((subProject) =>
        path.relative(this.outdir, subProject.outdir)
      )
    );
  }

  synth() {
    // Check to see if a new subProject was added
    const newSubProject = this.subProjects.find(
      (subProject) => !fs.existsSync(subProject.outdir)
    );

    // Need to synth before generating the package.json otherwise the subdirectory won't exist
    newSubProject && super.synth();

    this.subProjects
      .filter((subProject) => !(subProject instanceof NodeProject))
      .forEach((subProject) => {
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

        new JsonFile(subProject, "package.json", {
          obj: manifest,
          readonly: true,
        });
      });

    super.synth();
  }
}
