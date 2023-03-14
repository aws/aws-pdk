/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import {
  DependencyType,
  IgnoreFile,
  JsonFile,
  Project,
  Task,
  TaskStep,
  TextFile,
  YamlFile,
} from "projen";
import {
  NodePackage,
  NodePackageManager,
  NodeProject,
} from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { Nx } from "./nx-types";
import { DEFAULT_CONFIG, SyncpackConfig } from "./syncpack-options";

const NX_MONOREPO_PLUGIN_PATH: string = ".nx/plugins/nx-monorepo-plugin.js";

/**
 * Workspace configurations.
 *
 * @see https://classic.yarnpkg.com/lang/en/docs/workspaces/
 */
export interface WorkspaceConfig {
  /**
   * List of package globs to exclude from hoisting in the workspace.
   *
   * @see https://classic.yarnpkg.com/blog/2018/02/15/nohoist/
   */
  readonly noHoist?: string[];

  /**
   * Disable automatically applying `noHoist` logic for all sub-project "bundledDependencies".
   *
   * @default false
   */
  readonly disableNoHoistBundled?: boolean;

  /**
   * List of additional package globs to include in the workspace.
   *
   * All packages which are parented by the monorepo are automatically added to the workspace, but you can use this
   * property to specify any additional paths to packages which may not be managed by projen.
   */
  readonly additionalPackages?: string[];
}

/**
 * Configuration for Monorepo Upgrade Deps task.
 */
export interface MonorepoUpgradeDepsOptions {
  /**
   * Name of the task to create.
   *
   * @default upgrade-deps
   */
  readonly taskName?: string;

  /**
   * Syncpack configuration.
   *
   * No merging is performed and as such a complete syncpackConfig is required if supplied.
   *
   * @default SyncpackConfig.DEFAULT_CONFIG
   */
  readonly syncpackConfig?: SyncpackConfig;
}

/**
 * Configuration options for the NxMonorepoProject.
 */
export interface NxMonorepoProjectOptions extends TypeScriptProjectOptions {
  /**
   * Configuration for NX.
   */
  readonly nxConfig?: Nx.WorkspaceConfig;

  /**
   * Configuration for workspace.
   */
  readonly workspaceConfig?: WorkspaceConfig;

  /**
   * Whether to include an upgrade-deps task at the root of the monorepo which will upgrade all dependencies.
   *
   * @default true
   */
  readonly monorepoUpgradeDeps?: boolean;

  /**
   * Monorepo Upgrade Deps options.
   *
   * This is only used if monorepoUpgradeDeps is true.
   *
   * @default undefined
   */
  readonly monorepoUpgradeDepsOptions?: MonorepoUpgradeDepsOptions;
}

/**
 *
 * @see https://nx.dev/packages/nx/documents/run-many#options
 */
export interface NxRunManyOptions {
  /** Task to run for affected projects */
  readonly target: string;
  /** This is the configuration to use when performing tasks on projects */
  readonly configuration?: string;
  /** Exclude certain projects from being processed */
  readonly exclude?: string;
  /**
   * Do not stop command execution after the first failed task.
   */
  readonly noBail?: boolean;
  /**
   * Defines how Nx emits outputs tasks logs
   * @default "stream"
   */
  readonly outputStyle?:
    | "dynamic"
    | "static"
    | "stream"
    | "stream-without-prefixes";
  /**
   * Max number of parallel processes
   * @default 3
   */
  readonly parallel?: number;
  /** Project to run as list project names and/or patterns. */
  readonly projects?: string[];
  /** This is the name of the tasks runner configuration in nx.json */
  readonly runner?: string;
  /** Rerun the tasks even when the results are available in the cache. */
  readonly skipCache?: boolean;
  /** Ignore cycles in the task graph */
  readonly ignoreCycles?: boolean;
  /** Prints additional information about the commands (e.g. stack traces). */
  readonly verbose?: boolean;
}

/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid nx-monorepo
 */
export class NxMonorepoProject extends TypeScriptProject {
  // mutable data structures
  private readonly implicitDependencies: Nx.ImplicitDependencies;

  // immutable data structures
  private readonly nxConfig?: Nx.WorkspaceConfig;
  private readonly workspaceConfig?: WorkspaceConfig;
  private readonly workspacePackages: string[];

  private readonly nxJson: JsonFile;

  constructor(options: NxMonorepoProjectOptions) {
    super({
      ...options,
      github: options.github ?? false,
      package: options.package ?? false,
      prettier: options.prettier ?? true,
      projenrcTs: true,
      release: options.release ?? false,
      jest: options.jest ?? false,
      defaultReleaseBranch: options.defaultReleaseBranch ?? "mainline",
      sampleCode: false, // root should never have sample code,
      eslintOptions: options.eslintOptions ?? {
        dirs: ["."],
        ignorePatterns: ["packages/**/*.*"],
      },
      tsconfig: options.tsconfig ?? {
        compilerOptions: {
          rootDir: ".",
        },
        include: ["**/*.ts"],
      },
    });

    this.nxConfig = options.nxConfig;
    this.workspaceConfig = options.workspaceConfig;
    this.workspacePackages = options.workspaceConfig?.additionalPackages ?? [];
    this.implicitDependencies = this.nxConfig?.implicitDependencies || {};

    // Never publish a monorepo root package.
    this.package.addField("private", true);

    // Add alias task for "projen" to synthesize workspace
    this.addTask("synth-workspace", {
      exec: "npx projen",
      description: "Synthesize workspace",
    });

    this.addTask("run-many", {
      receiveArgs: true,
      exec: "npx nx run-many",
      description: "Run task against multiple workspace projects",
    });

    // Map tasks to nx run-many
    if (options.scripts == null || options.scripts.build == null) {
      this._overrideNxBuildTask(this.buildTask, { target: "build" }, true);
    }
    if (options.scripts == null || options.scripts["pre-compile"] == null) {
      this._overrideNxBuildTask(this.preCompileTask, { target: "pre-compile" });
    }
    if (options.scripts == null || options.scripts.compile == null) {
      this._overrideNxBuildTask(this.compileTask, { target: "compile" });
    }
    if (options.scripts == null || options.scripts["post-compile"] == null) {
      this._overrideNxBuildTask(this.postCompileTask, {
        target: "post-compile",
      });
    }
    if (options.scripts == null || options.scripts.test == null) {
      this._overrideNxBuildTask(this.testTask, { target: "test" });
    }
    if (options.scripts == null || options.scripts.eslint == null) {
      this._overrideNxBuildTask(this.eslint?.eslintTask, { target: "eslint" });
    }
    if (options.scripts == null || options.scripts.package == null) {
      this._overrideNxBuildTask(this.packageTask, { target: "package" });
    }
    if (options.scripts == null || options.scripts.prepare == null) {
      this._overrideNxBuildTask("prepare", { target: "prepare" });
    }
    if (options.scripts == null || options.scripts.watch == null) {
      this._overrideNxBuildTask(this.watchTask, {
        target: "watch",
        noBail: false,
        ignoreCycles: true,
        skipCache: true,
        outputStyle: "stream",
      });
    }

    this.addDevDeps("@nrwl/cli", "@nrwl/workspace");
    this.addDeps("aws-cdk-lib", "constructs", "cdk-nag"); // Needed as this can be bundled in aws-prototyping-sdk
    this.package.addPackageResolutions("@types/babel__traverse@7.18.2");

    if (options.monorepoUpgradeDeps !== false) {
      this.addDevDeps("npm-check-updates", "syncpack");

      const upgradeDepsTask = this.addTask(
        options.monorepoUpgradeDepsOptions?.taskName || "upgrade-deps"
      );
      upgradeDepsTask.exec(
        "npx npm-check-updates --deep --rejectVersion 0.0.0 -u"
      );
      upgradeDepsTask.exec("npx syncpack fix-mismatches");
      upgradeDepsTask.exec(`${this.package.packageManager} install`);
      upgradeDepsTask.exec("npx projen");

      new JsonFile(this, ".syncpackrc.json", {
        obj:
          options.monorepoUpgradeDepsOptions?.syncpackConfig || DEFAULT_CONFIG,
        readonly: true,
      });
    }

    options.nxConfig?.nxCloudReadOnlyAccessToken &&
      this.addDevDeps("@nrwl/nx-cloud");

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

    this.nxJson = new JsonFile(this, "nx.json", {
      obj: {
        extends: "@nrwl/workspace/presets/npm.json",
        plugins: [`./${NX_MONOREPO_PLUGIN_PATH}`],
        npmScope: "monorepo",
        tasksRunnerOptions: {
          default: {
            runner: options.nxConfig?.nxCloudReadOnlyAccessToken
              ? "@nrwl/nx-cloud"
              : "@nrwl/workspace/tasks-runners/default",
            options: {
              useDaemonProcess: false,
              cacheableOperations: options.nxConfig?.cacheableOperations || [
                "build",
                "test",
              ],
              accessToken: options.nxConfig?.nxCloudReadOnlyAccessToken,
            },
          },
        },
        namedInputs: {
          // https://nx.dev/more-concepts/customizing-inputs#defaults
          default: ["{projectRoot}/**/*"],
          ...options.nxConfig?.namedInputs,
        },
        targetDefaults: options.nxConfig?.targetDefaults,
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
          defaultBase: this.nxConfig?.affectedBranch || "mainline",
        },
      },
    });
  }

  /**
   * Helper to format `npx nx run-many ...` style command.
   * @param options
   */
  public formatNxRunManyCommand(options: NxRunManyOptions): string {
    const cmd: string[] = [
      "npx nx run-many",
      `--target=${options.target}`,
      `--output-style=${options.outputStyle || "stream"}`,
    ];
    if (options.configuration) {
      cmd.push(`--configuration=${options.configuration}`);
    }
    if (options.runner) {
      cmd.push(`--runner=${options.runner}`);
    }
    if (options.parallel) {
      cmd.push(`--parallel=${options.parallel}`);
    }
    if (options.skipCache) {
      cmd.push("--skip-nx-cache");
    }
    if (options.ignoreCycles) {
      cmd.push("--nx-ignore-cycles");
    }
    if (options.noBail !== true) {
      cmd.push("--nx-bail");
    }
    if (options.projects && options.projects.length) {
      cmd.push(`--projects=${options.projects.join(",")}`);
    }
    if (options.exclude) {
      cmd.push(`--exclude=${options.exclude}`);
    }
    if (options.verbose) {
      cmd.push("--verbose");
    }

    return cmd.join(" ");
  }

  /**
   * Overrides "build" related project tasks (build, compile, test, etc.) with `npx nx run-many` format.
   * @param task - The task or task name to override
   * @param options - Nx run-many options
   * @param force - Force unlocking task (eg: build task is locked)
   * @returns - The task that was overridden
   * @internal
   */
  protected _overrideNxBuildTask(
    task: Task | string | undefined,
    options: NxRunManyOptions,
    force?: boolean
  ): Task | undefined {
    if (typeof task === "string") {
      task = this.tasks.tryFind(task);
    }

    if (task == null) {
      return;
    }

    if (force) {
      // @ts-ignore - private property
      task._locked = false;
    }

    task.reset(this.formatNxRunManyCommand(options), {
      receiveArgs: true,
    });

    task.description += " for all affected projects";

    return task;
  }

  /**
   * Add project task that executes `npx nx run-many ...` style command.
   */
  public addNxRunManyTask(name: string, options: NxRunManyOptions): Task {
    return this.addTask(name, {
      receiveArgs: true,
      exec: this.formatNxRunManyCommand(options),
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

  /**
   * Add one or more additional package globs to the workspace.
   * @param packageGlobs paths to the package to include in the workspace (for example packages/my-package)
   */
  public addWorkspacePackages(...packageGlobs: string[]) {
    // Any subprojects that were added since the last call to this method need to be added first, in order to ensure
    // we add the workspace packages in a sane order.
    const relativeSubProjectWorkspacePackages =
      this.instantiationOrderSubProjects.map((project) =>
        path.relative(this.outdir, project.outdir)
      );
    const existingWorkspacePackages = new Set(this.workspacePackages);
    this.workspacePackages.push(
      ...relativeSubProjectWorkspacePackages.filter(
        (pkg) => !existingWorkspacePackages.has(pkg)
      )
    );

    // Add the additional packages next
    this.workspacePackages.push(...packageGlobs);
  }

  // Remove this hack once subProjects is made public in Projen
  private get instantiationOrderSubProjects(): Project[] {
    // @ts-ignore
    const subProjects: Project[] = this.subprojects || [];
    return subProjects;
  }

  public get subProjects(): Project[] {
    return this.instantiationOrderSubProjects.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.validateSubProjects();
    this.updateWorkspace();
    this.wirePythonDependencies();
    this.synthesizeNonNodePackageJson();

    // Prevent sub NodeProject packages from `postSynthesis` which will cause individual/extraneous installs.
    // The workspace package install will handle all the sub NodeProject packages automatically.
    const subProjectPackages: NodePackage[] = [];
    this.subProjects.forEach((subProject) => {
      if (isNodeProject(subProject)) {
        const subNodeProject: NodeProject = subProject as NodeProject;
        subProjectPackages.push(subNodeProject.package);
        // @ts-ignore - `installDependencies` is private
        subNodeProject.package.installDependencies = () => {};
      }
    });

    super.synth();

    // Force workspace install deps if any node subproject package has change, unless the workspace changed
    if (
      // @ts-ignore - `file` is private
      (this.package.file as JsonFile).changed !== true &&
      // @ts-ignore - `file` is private
      subProjectPackages.find((pkg) => (pkg.file as JsonFile).changed === true)
    ) {
      // @ts-ignore - `installDependencies` is private
      this.package.installDependencies();
    }
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
      .filter((subProject: Project) => !subProject.tryFindFile("package.json"))
      .forEach((subProject: Project) => {
        // generate a package.json if not found
        const manifest: any = {
          name: subProject.name,
          private: true,
          __pdk__: true,
          scripts: subProject.tasks.all.reduce(
            (p, c) => ({
              [c.name]: `npx projen ${c.name}`,
              ...p,
            }),
            {}
          ),
          version: "0.0.0",
        };

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
    // A final call to addWorkspacePackages will update the list of workspace packages with any subprojects that have
    // not yet been added, in the correct order
    this.addWorkspacePackages();

    let noHoist = this.workspaceConfig?.noHoist;
    // Automatically add all sub-project "bundledDependencies" to workspace "hohoist", otherwise they are not bundled in npm package
    if (this.workspaceConfig?.disableNoHoistBundled !== true) {
      const noHoistBundled = this.subProjects.flatMap((sub) => {
        if (sub instanceof NodeProject) {
          return sub.deps.all
            .filter((dep) => dep.type === DependencyType.BUNDLED)
            .flatMap((dep) => [
              `${sub.name}/${dep.name}`,
              `${sub.name}/${dep.name}/*`,
            ]);
        }
        return [];
      });

      if (noHoistBundled.length) {
        noHoist = [...(noHoist || []), ...noHoistBundled];
      }
    }

    // Add workspaces for each subproject
    if (this.package.packageManager === NodePackageManager.PNPM) {
      new YamlFile(this, "pnpm-workspace.yaml", {
        readonly: true,
        obj: {
          packages: this.workspacePackages,
        },
      });
    } else {
      this.package.addField("workspaces", {
        packages: this.workspacePackages,
        nohoist: noHoist,
      });
    }
  }

  /**
   * Updates the install task for python projects so that they are run serially and in dependency order such that python
   * projects within the monorepo can declare dependencies on one another.
   * @private
   */
  private wirePythonDependencies() {
    // Find any python projects
    const pythonProjects = this.subProjects.filter(
      (project) => project instanceof PythonProject
    ) as PythonProject[];

    if (pythonProjects.length === 0) {
      // Nothing to do for no python projects
      return;
    }

    // Move all install commands to install-py so that they are not installed in parallel by the monorepo package manager.
    // eg yarn install will run the install task for all packages in parallel which can lead to conflicts for python.
    pythonProjects.forEach((pythonProject) => {
      const installPyTask =
        pythonProject.tasks.tryFind("install-py") ??
        pythonProject.addTask("install-py");
      const installTask = pythonProject.tasks.tryFind("install");

      (installTask?.steps || []).forEach((step) => {
        this.copyStepIntoTask(step, installPyTask, pythonProject);
      });

      installTask?.reset();
    });

    // Add an install task to the monorepo to include running the install-py command serially to avoid conflicting writes
    // to a shared virtual env. This is also managed by nx so that installs occur in dependency order.
    const monorepoInstallTask =
      this.tasks.tryFind("install") ?? this.addTask("install");
    monorepoInstallTask.exec(
      `npx nx run-many --target install-py --projects ${pythonProjects
        .map((project) => project.name)
        .join(",")} --parallel=1`
    );
    this.defaultTask?.spawn(monorepoInstallTask);

    // Update the nx.json to ensure that install-py follows dependency order
    this.nxJson.addOverride("targetDependencies.install-py", [
      {
        target: "install-py",
        projects: "dependencies",
      },
    ]);
  }

  /**
   * Copies the given step into the given task. Step and Task must be from the given Project
   * @private
   */
  private copyStepIntoTask(step: TaskStep, task: Task, project: Project) {
    if (step.exec) {
      task.exec(step.exec, { name: step.name, cwd: step.cwd });
    } else if (step.say) {
      task.say(step.say, { name: step.name, cwd: step.cwd });
    } else if (step.spawn) {
      const stepToSpawn = project.tasks.tryFind(step.spawn);
      if (stepToSpawn) {
        task.spawn(stepToSpawn, { name: step.name, cwd: step.cwd });
      }
    } else if (step.builtin) {
      task.builtin(step.builtin);
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
