/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, Task } from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager } from "projen/lib/javascript";
import { Poetry, PythonProject, PythonProjectOptions } from "projen/lib/python";
import { NxProject } from "../../components/nx-project";
import { NxWorkspace } from "../../components/nx-workspace";
import { Nx } from "../../nx-types";
import { NodePackageUtils } from "../../utils";

/**
 * Configuration options for the NxMonorepoPythonProject.
 */
export interface NxMonorepoPythonProjectOptions extends PythonProjectOptions {
  readonly defaultReleaseBranch?: string;
}

/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid nx-monorepo-py
 */
export class NxMonorepoPythonProject extends PythonProject {
  public readonly nx: NxWorkspace;
  private readonly installTask?: Task;

  constructor(options: NxMonorepoPythonProjectOptions) {
    super({
      ...options,
      sample: false,
      poetry: true,
      pytest: false,
    });

    this.installTask = this.tasks.tryFind("install");
    this.addDevDependency("aws-prototyping-sdk.nx-monorepo@^0.x");

    this.addTask("run-many", {
      receiveArgs: true,
      exec: NodePackageUtils.command.exec(
        NodePackageManager.NPM,
        "nx",
        "run-many"
      ),
      description: "Run task against multiple workspace projects",
    });

    this.addTask("graph", {
      receiveArgs: true,
      exec: NodePackageUtils.command.exec(
        NodePackageManager.NPM,
        "nx",
        "graph"
      ),
      description: "Generate dependency graph for monorepo",
    });

    this.nx = NxWorkspace.of(this) || new NxWorkspace(this);
    this.nx.affected.defaultBase = options.defaultReleaseBranch ?? "mainline";
  }

  /**
   * Helper to format `npx nx run-many ...` style command execution in package manager.
   * @param options
   */
  public execNxRunManyCommand(options: Nx.RunManyOptions): string {
    return NodePackageUtils.command.exec(
      NodePackageManager.NPM,
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
    return this.addTask(name, {
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

    this.subprojects.forEach(_ensure);
  }

  preSynthesize(): void {
    // Calling before super() to ensure proper pre-synth of NxProject component and its nested components
    this._ensureNxProjectGraph();

    super.preSynthesize();
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.validateSubProjects();
    this.setupPythonNx();
    this.installPythonSubprojects();

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
   * Configures the python plugin on NX and ensures local nx dependencies are installed.
   */
  private setupPythonNx() {
    this.nx.plugins.push("@nxlv/python");
    this.installTask?.exec("npm install --save-dev @nxlv/python@^16 nx@^16");
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
  return project instanceof PythonProject;
}

/**
 * Determines if the passed in project uses Poetry.
 *
 * @param project PythonProject instance.
 * @returns true if the project uses Poetry.
 */
function isPoetryConfigured(project: PythonProject): boolean {
  return project.components.find((c) => c instanceof Poetry) !== undefined;
}
