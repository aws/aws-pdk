/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, Task } from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager } from "projen/lib/javascript";
import { Poetry, PythonProject } from "projen/lib/python";
import { PythonProjectOptions } from "./python-project-options";
import {
  INxProjectCore,
  NxConfigurator,
} from "../../components/nx-configurator";
import { NxProject } from "../../components/nx-project";
import { NxWorkspace } from "../../components/nx-workspace";
import { Nx } from "../../nx-types";
import { NodePackageUtils, ProjectUtils } from "../../utils";

/**
 * Configuration options for the NxMonorepoPythonProject.
 */
export interface MonorepoPythonProjectOptions extends PythonProjectOptions {
  readonly defaultReleaseBranch?: string;
}

/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid monorepo-py
 */
export class MonorepoPythonProject
  extends PythonProject
  implements INxProjectCore
{
  public readonly nxConfigurator: NxConfigurator;
  private readonly installTask?: Task;

  constructor(options: MonorepoPythonProjectOptions) {
    super({
      ...options,
      sample: false,
      poetry: true,
      pytest: options.pytest ?? false,
      version: options.version ?? "0.0.0",
      authorName: options.authorName ?? "pdkuser",
      authorEmail: options.authorEmail ?? "user@pdk.com",
    });

    this.addDevDependency("aws_pdk@^0");

    this.nxConfigurator = new NxConfigurator(this, {
      defaultReleaseBranch: options.defaultReleaseBranch ?? "main",
    });

    // Setup python NX plugin
    this.nx.plugins.push("@nxlv/python");
    this.installTask = this.nxConfigurator.ensureNxInstallTask({
      "@nxlv/python": "^16",
    });

    // Map tasks to nx run-many
    this.nxConfigurator._overrideNxBuildTask(
      this.buildTask,
      { target: "build" },
      { force: true }
    );

    this.nxConfigurator._overrideNxBuildTask(this.preCompileTask, {
      target: "pre-compile",
    });

    this.nxConfigurator._overrideNxBuildTask(this.compileTask, {
      target: "compile",
    });

    this.nxConfigurator._overrideNxBuildTask(this.postCompileTask, {
      target: "post-compile",
    });

    this.nxConfigurator._overrideNxBuildTask(this.testTask, {
      target: "test",
    });

    this.nxConfigurator._overrideNxBuildTask(this.packageTask, {
      target: "package",
    });
  }

  /**
   * @inheritdoc
   */
  public get nx(): NxWorkspace {
    return this.nxConfigurator.nx;
  }

  /**
   * @inheritdoc
   */
  public execNxRunManyCommand(options: Nx.RunManyOptions): string {
    return this.nxConfigurator.execNxRunManyCommand(options);
  }

  /**
   * @inheritdoc
   */
  public composeNxRunManyCommand(options: Nx.RunManyOptions): string[] {
    return this.nxConfigurator.composeNxRunManyCommand(options);
  }

  /**
   * @inheritdoc
   */
  public addNxRunManyTask(name: string, options: Nx.RunManyOptions): Task {
    return this.nxConfigurator.addNxRunManyTask(name, options);
  }

  /**
   * @inheritdoc
   */
  public addImplicitDependency(
    dependent: Project,
    dependee: string | Project
  ): void {
    this.nxConfigurator.addImplicitDependency(dependent, dependee);
  }

  /**
   * @inheritdoc
   */
  public addJavaDependency(
    dependent: JavaProject,
    dependee: JavaProject
  ): void {
    this.nxConfigurator.addJavaDependency(dependent, dependee);
  }

  /**
   * @inheritdoc
   */
  public addPythonPoetryDependency(
    dependent: PythonProject,
    dependee: PythonProject
  ): void {
    this.nxConfigurator.addPythonPoetryDependency(dependent, dependee);
  }

  /**
   * @inheritdoc
   */
  preSynthesize(): void {
    // Calling before super() to ensure proper pre-synth of NxProject component and its nested components
    this.nxConfigurator.preSynthesize();

    super.preSynthesize();
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.validateSubProjects();
    this.installPythonSubprojects();
    this.nxConfigurator.synth();

    super.synth();
  }

  /**
   * @inheritdoc
   *
   * NOTE: Be sure to ensure the VIRTUAL_ENV is unset during postSynthesize as the individual poetry envs will only be created if a existing VIRTUAL_ENV cannot be found.
   */
  postSynthesize(): void {
    const vEnv = process.env.VIRTUAL_ENV;
    process.env.VIRTUAL_ENV = "";
    super.postSynthesize();
    process.env.VIRTUAL_ENV = vEnv;
  }

  /**
   * Ensures all python subprojects have their install target called after the monorepo install task.
   */
  private installPythonSubprojects() {
    const installProjects = this.subprojects.filter(
      (project) => isPythonProject(project) && this.installTask
    );

    if (this.installTask && installProjects.length > 0) {
      const nxRunManyInstall = this.composeNxRunManyCommand({
        target: "install",
        projects: installProjects.map((project) => project.name),
        parallel: 1,
      });

      this.installTask.exec(
        NodePackageUtils.command.exec(
          NodePackageManager.NPM,
          ...nxRunManyInstall
        )
      );

      // Ensure that install-py follows dependency order
      installProjects.forEach((p) => {
        NxProject.ensure(p).setTarget("install", {
          dependsOn: ["^install"],
        });
      });
    }
  }

  /**
   * Ensures subprojects don't have a default task and that all Python subpackages are configured to use Poetry.
   */
  private validateSubProjects() {
    this.subprojects.forEach((subProject: any) => {
      // Disable default task on subprojects as this isn't supported in a monorepo
      subProject.defaultTask?.reset();

      if (isPythonProject(subProject) && !isPoetryConfigured(subProject)) {
        throw new Error(
          `${subProject.name} must use poetry to manage dependencies when using NXMonorepoPythonProject`
        );
      }
    });
  }
}

/**
 * Determines if the passed in project is of type PythonProject.
 *
 * @param project Project instance.
 * @returns true if the project instance is of type PythonProject.
 */
function isPythonProject(project: any): boolean {
  return ProjectUtils.isNamedInstanceOf(project, PythonProject);
}

/**
 * Determines if the passed in project uses Poetry.
 *
 * @param project PythonProject instance.
 * @returns true if the project uses Poetry.
 */
function isPoetryConfigured(project: PythonProject): boolean {
  return (
    project.components.find((c) =>
      ProjectUtils.isNamedInstanceOf(c, Poetry)
    ) !== undefined
  );
}
