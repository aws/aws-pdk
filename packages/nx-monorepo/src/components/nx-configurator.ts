/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, Project, Task } from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager } from "projen/lib/javascript";
import { Poetry, PythonProject } from "projen/lib/python";
import { NxProject } from "./nx-project";
import { NxWorkspace } from "./nx-workspace";
import { Nx } from "../nx-types";
import { NodePackageUtils } from "../utils";

/**
 * Interface that all NXProject implementations should implement.
 */
export interface INxProjectCore {
  /**
   * Return the NxWorkspace instance. This should be implemented using a getter.
   */
  readonly nx: NxWorkspace;

  /**
   * Helper to format `npx nx run-many ...` style command execution in package manager.
   * @param options
   */
  execNxRunManyCommand(options: Nx.RunManyOptions): string;

  /**
   * Helper to format `npx nx run-many ...` style command
   * @param options
   */
  composeNxRunManyCommand(options: Nx.RunManyOptions): string[];

  /**
   * Add project task that executes `npx nx run-many ...` style command.
   *
   * @param name task name
   * @param options options
   */
  addNxRunManyTask(name: string, options: Nx.RunManyOptions): Task;

  /**
   * Create an implicit dependency between two Projects. This is typically
   * used in polygot repos where a Typescript project wants a build dependency
   * on a Python project as an example.
   *
   * @param dependent project you want to have the dependency.
   * @param dependee project you wish to depend on.
   * @throws error if this is called on a dependent which does not have a NXProject component attached.
   */
  addImplicitDependency(dependent: Project, dependee: Project | string): void;

  /**
   * Adds a dependency between two Java Projects in the monorepo.
   * @param dependent project you want to have the dependency
   * @param dependee project you wish to depend on
   */
  addJavaDependency(dependent: JavaProject, dependee: JavaProject): void;

  /**
   * Adds a dependency between two Python Projects in the monorepo. The dependent must have Poetry enabled.
   * @param dependent project you want to have the dependency (must be a Poetry Python Project)
   * @param dependee project you wish to depend on
   * @throws error if the dependent does not have Poetry enabled
   */
  addPythonPoetryDependency(
    dependent: PythonProject,
    dependee: PythonProject
  ): void;
}

/**
 * NXConfigurator options.
 */
export interface NxConfiguratorOptions {
  /**
   * Branch that NX affected should run against.
   */
  readonly defaultReleaseBranch?: string;
}

/**
 * Configues common NX related tasks and methods.
 */
export class NxConfigurator extends Component implements INxProjectCore {
  public readonly nx: NxWorkspace;

  constructor(project: Project, options?: NxConfiguratorOptions) {
    super(project);

    project.addTask("run-many", {
      receiveArgs: true,
      exec: NodePackageUtils.command.exec(
        NodePackageUtils.getNodePackageManager(
          this.project,
          NodePackageManager.NPM
        ),
        "nx",
        "run-many"
      ),
      description: "Run task against multiple workspace projects",
    });

    project.addTask("graph", {
      receiveArgs: true,
      exec: NodePackageUtils.command.exec(
        NodePackageUtils.getNodePackageManager(
          this.project,
          NodePackageManager.NPM
        ),
        "nx",
        "graph"
      ),
      description: "Generate dependency graph for monorepo",
    });

    this.nx = NxWorkspace.of(project) || new NxWorkspace(project);
    this.nx.affected.defaultBase = options?.defaultReleaseBranch ?? "mainline";
  }

  /**
   * Returns the install task or creates one with nx installation command added.
   *
   * Note: this should only be called from non-node projects
   *
   * @param nxPlugins additional plugins to install
   * @returns install task
   */
  public ensureNxInstallTask(...nxPlugins: string[]): Task {
    const plugins = nxPlugins.length > 0 ? `${nxPlugins.join(" ")} ` : "";
    const installTask =
      this.project.tasks.tryFind("install") ?? this.project.addTask("install");
    installTask.exec(`npm install --save-dev ${plugins}nx@^16`);
    return installTask;
  }

  /**
   * Helper to format `npx nx run-many ...` style command execution in package manager.
   * @param options
   */
  public execNxRunManyCommand(options: Nx.RunManyOptions): string {
    return NodePackageUtils.command.exec(
      NodePackageUtils.getNodePackageManager(
        this.project,
        NodePackageManager.NPM
      ),
      ...this.composeNxRunManyCommand(options)
    );
  }

  /**
   * Helper to format `npx nx run-many ...` style command
   * @param options
   */
  public composeNxRunManyCommand(options: Nx.RunManyOptions): string[] {
    const args: string[] = [];
    if (options.configuration) {
      args.push(`--configuration=${options.configuration}`);
    }
    if (options.runner) {
      args.push(`--runner=${options.runner}`);
    }
    if (options.parallel) {
      args.push(`--parallel=${options.parallel}`);
    }
    if (options.skipCache) {
      args.push("--skip-nx-cache");
    }
    if (options.ignoreCycles) {
      args.push("--nx-ignore-cycles");
    }
    if (options.noBail !== true) {
      args.push("--nx-bail");
    }
    if (options.projects && options.projects.length) {
      args.push(`--projects=${options.projects.join(",")}`);
    }
    if (options.exclude) {
      args.push(`--exclude=${options.exclude}`);
    }
    if (options.verbose) {
      args.push("--verbose");
    }

    return [
      "nx",
      "run-many",
      `--target=${options.target}`,
      `--output-style=${options.outputStyle || "stream"}`,
      ...args,
    ];
  }

  /**
   * Add project task that executes `npx nx run-many ...` style command.
   */
  public addNxRunManyTask(name: string, options: Nx.RunManyOptions): Task {
    return this.project.addTask(name, {
      receiveArgs: true,
      exec: this.execNxRunManyCommand(options),
    });
  }

  /**
   * Create an implicit dependency between two Projects. This is typically
   * used in polygot repos where a Typescript project wants a build dependency
   * on a Python project as an example.
   *
   * @param dependent project you want to have the dependency.
   * @param dependee project you wish to depend on.
   * @throws error if this is called on a dependent which does not have a NXProject component attached.
   */
  public addImplicitDependency(dependent: Project, dependee: Project | string) {
    NxProject.ensure(dependent).addImplicitDependency(dependee);
  }

  /**
   * Adds a dependency between two Java Projects in the monorepo.
   * @param dependent project you want to have the dependency
   * @param dependee project you wish to depend on
   */
  public addJavaDependency(dependent: JavaProject, dependee: JavaProject) {
    // Add implicit dependency for build order
    this.addImplicitDependency(dependent, dependee);

    // Add dependency in pom.xml
    dependent.addDependency(
      `${dependee.pom.groupId}/${dependee.pom.artifactId}@${dependee.pom.version}`
    );

    // Add a repository so that the dependency in the pom can be resolved
    dependent.pom.addRepository({
      id: dependee.name,
      url: `file://${path.join(
        path.relative(dependent.outdir, dependee.outdir),
        dependee.packaging.distdir
      )}`,
    });
  }

  /**
   * Adds a dependency between two Python Projects in the monorepo. The dependent must have Poetry enabled.
   * @param dependent project you want to have the dependency (must be a Poetry Python Project)
   * @param dependee project you wish to depend on
   * @throws error if the dependent does not have Poetry enabled
   */
  public addPythonPoetryDependency(
    dependent: PythonProject,
    dependee: PythonProject
  ) {
    // Check we're adding the dependency to a poetry python project
    if (!(dependent.depsManager instanceof Poetry)) {
      throw new Error(
        `${dependent.name} must be a PythonProject with Poetry enabled to add this dependency`
      );
    }

    // Add implicit dependency for build order
    this.addImplicitDependency(dependent, dependee);

    // Add local path dependency
    dependent.addDependency(
      `${dependee.name}@{path="${path.relative(
        dependent.outdir,
        dependee.outdir
      )}", develop=true}`
    );
  }

  /**
   * Ensures that all non-root projects have NxProject applied.
   * @internal
   */
  protected _ensureNxProjectGraph(): void {
    function _ensure(_project: Project) {
      if (_project.root === _project) return;

      NxProject.ensure(_project);

      _project.subprojects.forEach((p) => {
        _ensure(p);
      });
    }

    this.project.subprojects.forEach(_ensure);
  }

  preSynthesize(): void {
    // Calling before super() to ensure proper pre-synth of NxProject component and its nested components
    this._ensureNxProjectGraph();
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.resetDefaultTask();
  }

  /**
   * Ensures subprojects don't have a default task
   */
  private resetDefaultTask() {
    this.project.subprojects.forEach((subProject: any) => {
      // Disable default task on subprojects as this isn't supported in a monorepo
      subProject.defaultTask?.reset();
    });
  }
}
