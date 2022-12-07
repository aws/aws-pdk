/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import {
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
import { DEFAULT_CONFIG, SyncpackConfig } from "./syncpack-options";

const NX_MONOREPO_PLUGIN_PATH: string = ".nx/plugins/nx-monorepo-plugin.js";

/**
 * Configuration for nx targetDependencies.
 */
export type TargetDependencies = { [target: string]: TargetDependency[] };

/**
 * Configuration for project specific targets.
 */
export type ProjectTargets = { [target: string]: ProjectTarget };

/**
 * Project Target.
 */
export interface ProjectTarget {
  /**
   * List of outputs to cache, relative to the root of the monorepo.
   *
   * note: must start with leading /
   */
  readonly outputs?: string[];

  /**
   * List of Target Dependencies.
   */
  readonly dependsOn: TargetDependency[];
}

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
   * Affected branch.
   *
   * @default mainline
   */
  readonly affectedBranch?: string;
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

  /**
   * Read only access token if enabling nx cloud.
   */
  readonly nxCloudReadOnlyAccessToken?: string;
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
  readonly nxConfig?: NXConfig;

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
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid nx-monorepo
 */
export class NxMonorepoProject extends TypeScriptProject {
  // mutable data structures
  private readonly implicitDependencies: ImplicitDependencies;
  private readonly targetOverrides: { [pkg: string]: ProjectTargets } = {};

  // immutable data structures
  private readonly nxConfig?: NXConfig;
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

    // No need to compile or test a monorepo root package.
    this.compileTask.reset();
    this.testTask.reset();

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
              cacheableOperations: ["build", "test"],
              accessToken: options.nxConfig?.nxCloudReadOnlyAccessToken,
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
          defaultBase: this.nxConfig?.affectedBranch || "mainline",
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

  /**
   * Allow project specific target overrides.
   */
  public overrideProjectTargets(project: Project, targets: ProjectTargets) {
    const _package = project.tryFindObjectFile("package.json");
    _package?.addOverride("nx", {
      targets: targets,
    });

    !_package && (this.targetOverrides[project.outdir] = targets);
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
        const manifest: any = {};
        (manifest.nx = this.targetOverrides[subProject.outdir]
          ? { targets: this.targetOverrides[subProject.outdir] }
          : undefined),
          (manifest.name = subProject.name);
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
    // A final call to addWorkspacePackages will update the list of workspace packages with any subprojects that have
    // not yet been added, in the correct order
    this.addWorkspacePackages();

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
        nohoist: this.workspaceConfig?.noHoist,
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
