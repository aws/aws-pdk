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

import * as fs from "fs";
import * as path from "path";
import { IgnoreFile, JsonFile, Project, TextFile, YamlFile } from "projen";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";

const NX_MONOREPO_PLUGIN_PATH: string = ".nx/plugins/nx-monorepo-plugin.js";

/**
 * Configuration for nx targetDependencies.
 */
export type TargetDependencies = { [target: string]: TargetDependency[] };

/**
 * Implicit Dependencies map.
 */
export type ImplicitDependencies = { [pkg: string]: string[] };

/**
 * Supported enums for a TargetDependency.
 */
export enum TargetDependencyProject {
  /**
   * Only rely on the package where the target is called.
   *
   * This is usually done for test like targets where you only want to run unit
   * tests on the target packages without testing all dependent packages.
   */
  SELF = "self",
  /**
   * Target relies on executing the target against all dependencies first.
   *
   * This is usually done for build like targets where you want to build all
   * dependant projects first.
   */
  DEPENDENCIES = "dependencies",
}

/**
 * Represents an NX Target Dependency.
 */
export interface TargetDependency {
  /**
   * Projen target i.e: build, test, etc
   */
  readonly target: string;

  /**
   * Target dependencies.
   */
  readonly projects: TargetDependencyProject;
}

/**
 * NX configurations.
 *
 * @link https://nx.dev/configuration/packagejson
 */
export interface NXConfig {
  /**
   * Configuration for Implicit Dependnecies.
   *
   * @link https://nx.dev/configuration/packagejson#implicitdependencies
   */
  readonly implicitDependencies?: ImplicitDependencies;

  /**
   * Configuration for TargetDependencies.
   *
   * @link https://nx.dev/configuration/packagejson#target-dependencies
   */
  readonly targetDependencies?: TargetDependencies;

  /**
   * List of patterns to include in the .nxignore file.
   *
   * @link https://nx.dev/configuration/packagejson#nxignore
   */
  readonly nxIgnore?: string[];
}

/**
 * Workspace configurations.
 *
 * @link https://classic.yarnpkg.com/lang/en/docs/workspaces/
 */
export interface WorkspaceConfig {
  /**
   * List of package globs to exclude from hoisting in the workspace.
   *
   * @link https://classic.yarnpkg.com/blog/2018/02/15/nohoist/
   */
  readonly noHoist?: string[];
}

/**
 * Configuration options for the NxMonorepoProject.
 */
export interface NxMonorepoProjectOptions extends TypeScriptProjectOptions {
  /**
   * Configuration for NX.
   */
  readonly nxConfig?: NXConfig;

  /**
   * Configuration for workspace.
   */
  readonly workspaceConfig?: WorkspaceConfig;
}

/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid nx-monorepo
 */
export class NxMonorepoProject extends TypeScriptProject {
  // mutable data structures
  private readonly implicitDependencies: ImplicitDependencies;

  // immutable data structures
  private readonly nxConfig?: NXConfig;
  private readonly workspaceConfig?: WorkspaceConfig;

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
      defaultReleaseBranch: "mainline",
    });

    this.nxConfig = options.nxConfig;
    this.workspaceConfig = options.workspaceConfig;
    this.implicitDependencies = this.nxConfig?.implicitDependencies || {};

    // Never publish a monorepo root package.
    this.package.addField("private", true);

    // No need to compile or test a monorepo root package.
    this.compileTask.reset();
    this.testTask.reset();

    this.addDevDeps("@nrwl/cli", "@nrwl/workspace");

    new IgnoreFile(this, ".nxignore").exclude(
      "test-reports",
      "target",
      ".env",
      ".pytest_cache",
      ...(this.nxConfig?.nxIgnore || [])
    );

    new TextFile(this, NX_MONOREPO_PLUGIN_PATH, {
      readonly: true,
      lines: fs.readFileSync(getPluginPath()).toString("utf-8").split("\n"),
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
          ...(this.nxConfig?.targetDependencies || {}),
        },
        affected: {
          defaultBase: "mainline",
        },
      },
    });
  }

  /**
   * Create an implicit dependency between two Project's. This is typically
   * used in polygot repos where a Typescript project wants a build dependency
   * on a Python project as an example.
   *
   * @param dependent project you want to have the dependency.
   * @param dependee project you wish to depend on.
   */
  public addImplicitDependency(dependent: Project, dependee: Project) {
    if (this.implicitDependencies[dependent.name]) {
      this.implicitDependencies[dependent.name].push(dependee.name);
    } else {
      this.implicitDependencies[dependent.name] = [dependee.name];
    }
  }

  // Remove this hack once subProjects is made public in Projen
  protected get subProjects(): Project[] {
    // @ts-ignore
    const subProjects: Project[] = this.subprojects || [];
    return subProjects.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.validateSubProjects();
    this.updateWorkspace();
    this.synthesizeNonNodePackageJson();
    super.synth();
  }

  /**
   * Ensures subprojects don't have a default task and that all packages use the same package manager.
   */
  private validateSubProjects() {
    this.subProjects.forEach((subProject: any) => {
      // Disable default task on subprojects as this isn't supported in a monorepo
      subProject.defaultTask?.reset();

      if (
        isNodeProject(subProject) &&
        subProject.package.packageManager !== this.package.packageManager
      ) {
        throw new Error(
          `${subProject.name} packageManager does not match the monorepo packageManager: ${this.package.packageManager}.`
        );
      }
    });
  }

  /**
   * For non-node projects, a package.json is required in order to be discovered by NX.
   */
  private synthesizeNonNodePackageJson() {
    this.subProjects
      .filter((subProject: any) => !isNodeProject(subProject))
      .forEach((subProject: Project) => {
        // generate a package.json if not found
        const manifest: any = {};
        manifest.name = subProject.name;
        manifest.private = true;
        manifest.__pdk__ = true;
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
  }

  /**
   * Add a submodule entry to the appropriate workspace file.
   */
  private updateWorkspace() {
    // Add workspaces for each subproject
    if (this.package.packageManager === NodePackageManager.PNPM) {
      new YamlFile(this, "pnpm-workspace.yaml", {
        readonly: true,
        obj: {
          packages: this.subProjects.map((subProject) =>
            path.relative(this.outdir, subProject.outdir)
          ),
        },
      });
    } else {
      this.package.addField("workspaces", {
        packages: this.subProjects.map((subProject) =>
          path.relative(this.outdir, subProject.outdir)
        ),
        nohoist: this.workspaceConfig?.noHoist,
      });
    }
  }
}

/**
 * Determines if the passed in project is of type NodeProject.
 *
 * @param project Project instance.
 * @returns true if the project instance is of type NodeProject.
 */
function isNodeProject(project: any) {
  return project instanceof NodeProject || project.package;
}

function getPluginPath() {
  return path.join(__dirname, "plugin/nx-monorepo-plugin.js");
}
