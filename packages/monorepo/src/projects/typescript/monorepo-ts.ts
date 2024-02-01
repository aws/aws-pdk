/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  Dependency,
  DependencyType,
  JsonFile,
  Project,
  Task,
  YamlFile,
} from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import { Syncpack } from "./syncpack-options";
import { TypeScriptProjectOptions } from "./typescript-project-options";
import {
  NxConfigurator,
  INxProjectCore,
} from "../../components/nx-configurator";
import { NxProject } from "../../components/nx-project";
import { NxWorkspace } from "../../components/nx-workspace";
import {
  DEFAULT_PROJEN_VERSION,
  syncProjenVersions,
} from "../../components/projen-dependency";
import { Nx } from "../../nx-types";
import { NodePackageUtils, ProjectUtils } from "../../utils";

/**
 * Workspace configurations.
 *
 * @see https://classic.yarnpkg.com/lang/en/docs/workspaces/
 */
export interface WorkspaceConfig {
  /**
   * Yarn workspace config
   */
  readonly yarn?: YarnWorkspaceConfig;

  /**
   * Links all local workspace project bins so they can be used for local development.
   *
   * Package bins are only linked when installed from the registry, however it is very useful
   * for monorepo development to also utilize these bin scripts. When enabled, this flag will
   * recursively link all bins from packages.json files to the root node_modules/.bin.
   */
  readonly linkLocalWorkspaceBins?: boolean;

  /**
   * List of additional package globs to include in the workspace.
   *
   * All packages which are parented by the monorepo are automatically added to the workspace, but you can use this
   * property to specify any additional paths to packages which may not be managed by projen.
   */
  readonly additionalPackages?: string[];
}

/**
 * Yarn related workspace config
 */
export interface YarnWorkspaceConfig {
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
   * @default Syncpack.DEFAULT_CONFIG
   */
  readonly syncpackConfig?: Syncpack.SyncpackConfig;
}

/**
 * Configuration options for the MonorepoTsProject.
 */
export interface MonorepoTsProjectOptions extends TypeScriptProjectOptions {
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

  /**
   * Disable node warnings from being emitted during build tasks
   * @default false
   */
  readonly disableNodeWarnings?: boolean;
}

/**
 * This project type will bootstrap a monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid monorepo-ts
 */
export class MonorepoTsProject
  extends TypeScriptProject
  implements INxProjectCore
{
  /**
   * Version of projen used by the monorepo and its subprojects
   */
  private readonly projenVersion: string;

  // immutable data structures
  private readonly workspaceConfig?: WorkspaceConfig;
  private readonly workspacePackages: string[];

  public readonly nxConfigurator: NxConfigurator;

  private readonly _options: MonorepoTsProjectOptions;

  private subNodeProjectResolves: Array<() => boolean> = [];

  constructor(options: MonorepoTsProjectOptions) {
    const defaultReleaseBranch = options.defaultReleaseBranch ?? "main";
    super({
      ...options,
      github: options.github ?? false,
      package: options.package ?? false,
      projenCommand: options.packageManager
        ? NodePackageUtils.command.projen(options.packageManager)
        : undefined,
      prettier: options.prettier ?? true,
      projenrcTs: true,
      release: options.release ?? false,
      jest: options.jest ?? false,
      sampleCode: false, // root should never have sample code,
      gitignore: [".tmp", ...(options.gitignore ?? [])],
      defaultReleaseBranch,
      eslintOptions: options.eslintOptions ?? {
        dirs: ["."],
        ignorePatterns: ["packages/**/*.*"],
      },
      tsconfig: options.tsconfig ?? {
        compilerOptions: {
          rootDir: ".",
        },
        include: ["**/*.ts", ".projenrc.ts"],
      },
      peerDeps: ["nx@^16", ...(options.peerDeps || [])],
      devDeps: ["nx@^16", "@aws/pdk@^0", ...(options.devDeps || [])],
      deps: [
        "aws-cdk-lib",
        "cdk-nag",
        "@aws-cdk/aws-cognito-identitypool-alpha@latest",
        ...(options.deps || []),
      ],
      projenVersion: options.projenVersion ?? DEFAULT_PROJEN_VERSION,
    });

    this.projenVersion = options.projenVersion ?? DEFAULT_PROJEN_VERSION;

    this.nxConfigurator = new NxConfigurator(this, {
      defaultReleaseBranch,
    });
    this._options = options;

    // engines
    this.package.addEngine("node", ">=16");
    switch (this.package.packageManager) {
      case NodePackageManager.BUN: {
        this.package.addEngine("bun", ">=1");
        break;
      }
      case NodePackageManager.PNPM: {
        // https://pnpm.io/package_json
        // https://github.com/pnpm/pnpm/releases/tag/v8.0.0
        this.package.addEngine("pnpm", ">=8");
        break;
      }
      case NodePackageManager.YARN_CLASSIC:
      case NodePackageManager.YARN: {
        this.package.addEngine("yarn", ">=1 <2");
        break;
      }
      case NodePackageManager.YARN_BERRY:
      case NodePackageManager.YARN2: {
        this.package.addEngine("yarn", ">=2");
        this.gitignore.addPatterns(
          ".yarn/*",
          ".pnp.cjs",
          "!.yarn/releases",
          "!.yarn/plugins"
        );
        break;
      }
      case NodePackageManager.NPM: {
        // Allow older versions of peer deps to resolv compatibility issues
        this.tasks.tryFind("install")?.reset("npm install --legacy-peer-deps");
        this.tasks.tryFind("install:ci")?.reset("npm ci --legacy-peer-deps");
        break;
      }
    }
    this.package.setScript(
      "install:ci",
      NodePackageUtils.command.exec(
        this.package.packageManager,
        "projen install:ci"
      )
    );

    this.workspaceConfig = options.workspaceConfig;
    this.workspacePackages = options.workspaceConfig?.additionalPackages ?? [];

    // Never publish a monorepo root package.
    this.package.addField("private", true);

    // Add alias task for "projen" to synthesize workspace
    this.package.setScript(
      "synth-workspace",
      NodePackageUtils.command.projen(this.package.packageManager)
    );

    // Map tasks to nx run-many
    if (options.scripts == null || options.scripts.build == null) {
      this.nxConfigurator._overrideNxBuildTask(
        this.buildTask,
        { target: "build" },
        { force: true }
      );
    }
    if (options.scripts == null || options.scripts["pre-compile"] == null) {
      this.nxConfigurator._overrideNxBuildTask(this.preCompileTask, {
        target: "pre-compile",
      });
    }
    if (options.scripts == null || options.scripts.compile == null) {
      this.nxConfigurator._overrideNxBuildTask(this.compileTask, {
        target: "compile",
      });
    }
    if (options.scripts == null || options.scripts["post-compile"] == null) {
      this.nxConfigurator._overrideNxBuildTask(this.postCompileTask, {
        target: "post-compile",
      });
    }
    if (options.scripts == null || options.scripts.test == null) {
      this.nxConfigurator._overrideNxBuildTask(this.testTask, {
        target: "test",
      });
    }
    if (options.scripts == null || options.scripts.eslint == null) {
      // The Projenrc component of TypeScriptProject resets the eslint task as part of preSynthesize which would undo
      // our changes, so we disable further resets.
      this.nxConfigurator._overrideNxBuildTask(
        this.eslint?.eslintTask,
        { target: "eslint" },
        { disableReset: true }
      );
    }
    if (options.scripts == null || options.scripts.package == null) {
      this.nxConfigurator._overrideNxBuildTask(this.packageTask, {
        target: "package",
      });
    }
    if (options.scripts == null || options.scripts.prepare == null) {
      this.nxConfigurator._overrideNxBuildTask("prepare", {
        target: "prepare",
      });
    }
    if (options.scripts == null || options.scripts.watch == null) {
      this.nxConfigurator._overrideNxBuildTask(this.watchTask, {
        target: "watch",
        noBail: false,
        ignoreCycles: true,
        skipCache: true,
        outputStyle: "stream",
      });
    }

    this.package.addPackageResolutions(
      "@types/babel__traverse@7.18.2",
      "wrap-ansi@^7.0.0",
      "@zkochan/js-yaml@npm:js-yaml@4.1.0"
    );

    if (options.monorepoUpgradeDeps !== false) {
      this.addDevDeps("npm-check-updates", "syncpack@^12");

      const upgradeDepsTask = this.addTask(
        options.monorepoUpgradeDepsOptions?.taskName || "upgrade-deps"
      );
      upgradeDepsTask.exec(
        NodePackageUtils.command.exec(
          this.package.packageManager,
          "npm-check-updates",
          "--deep",
          "--rejectVersion",
          "0.0.0",
          "-u",
          "--dep",
          "prod,dev,peer,optional,bundle",
          "--target=minor"
        )
      );
      upgradeDepsTask.exec(
        NodePackageUtils.command.exec(
          this.package.packageManager,
          "syncpack",
          "fix-mismatches"
        )
      );
      upgradeDepsTask.exec(`rm ${this.package.lockFile}`);
      upgradeDepsTask.exec(
        NodePackageUtils.command.install(this.package.packageManager)
      );
      upgradeDepsTask.exec(
        NodePackageUtils.command.exec(this.package.packageManager, "projen")
      );

      new JsonFile(this, ".syncpackrc.json", {
        obj:
          options.monorepoUpgradeDepsOptions?.syncpackConfig ||
          Syncpack.DEFAULT_CONFIG,
        readonly: true,
      });
    }
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
   * Add one or more additional package globs to the workspace.
   * @param packageGlobs paths to the package to include in the workspace (for example packages/my-package)
   */
  public addWorkspacePackages(...packageGlobs: string[]) {
    // Any subprojects that were added since the last call to this method need to be added first, in order to ensure
    // we add the workspace packages in a sane order.
    const relativeSubProjectWorkspacePackages = this.sortedSubProjects
      .filter((s) => ProjectUtils.isNamedInstanceOf(s, NodeProject))
      .map((project) => path.relative(this.outdir, project.outdir));
    const existingWorkspacePackages = new Set(this.workspacePackages);
    this.workspacePackages.push(
      ...relativeSubProjectWorkspacePackages.filter(
        (pkg) => !existingWorkspacePackages.has(pkg)
      )
    );

    // Add the additional packages next
    this.workspacePackages.push(...packageGlobs);
  }

  /** Get consistently sorted list of subprojects */
  public get sortedSubProjects(): Project[] {
    return this.subprojects
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Create symbolic links to all local workspace bins. This enables the usage of bins the same
   * way as consumers of the packages have when installing from the registry.
   */
  protected linkLocalWorkspaceBins(): void {
    const bins: [string, string][] = [];

    this.subprojects.forEach((subProject) => {
      if (
        ProjectUtils.isNamedInstanceOf(subProject, NodeProject) &&
        subProject.name !== "@aws/pdk"
      ) {
        const pkgBins: Record<string, string> =
          subProject.package.manifest.bin() || {};
        bins.push(
          ...Object.entries(pkgBins).map(([cmd, bin]) => {
            const resolvedBin = path.join(
              "$PWD",
              path.relative(this.outdir, subProject.outdir),
              bin
            );
            return [cmd, resolvedBin] as [string, string];
          })
        );
      }
    });

    const linkTask = this.addTask("workspace:bin:link", {
      steps: bins.map(([cmd, bin]) => ({
        exec: `ln -s ${bin} ${NodePackageUtils.command.bin(
          this.package.packageManager,
          cmd
        )} &>/dev/null; exit 0;`,
      })),
    });

    (this.tasks.tryFind("prepare") || this.addTask("prepare")).spawn(linkTask);
  }

  preSynthesize(): void {
    NodePackageUtils.removeProjenScript(this);
    this.nxConfigurator.preSynthesize();
    super.preSynthesize();

    if (this._options.workspaceConfig?.linkLocalWorkspaceBins === true) {
      this.linkLocalWorkspaceBins();
    }

    if (this.package.packageManager === NodePackageManager.PNPM) {
      // PNPM hoisting hides transitive bundled dependencies which results in
      // transitive dependencies being packed incorrectly.
      this.subprojects.forEach((subProject) => {
        if (
          NodePackageUtils.isNodeProject(subProject) &&
          getBundledDeps(subProject).length
        ) {
          const pkgFolder = path.relative(this.root.outdir, subProject.outdir);
          // Create a symlink in the sub-project node_modules for all transitive deps
          // before running "package" task
          subProject.packageTask.prependExec(
            `monorepo.pnpm-link-bundled-transitive-deps ${pkgFolder}`
          );
        }
      });
    }

    this.subprojects.forEach((subProject) => {
      if (NodePackageUtils.isNodeProject(subProject)) {
        // Remove any subproject .npmrc files since only the root one matters
        subProject.tryRemoveFile(".npmrc");
        NodePackageUtils.removeProjenScript(subProject);
      }
    });

    syncProjenVersions(this.subprojects, this.projenVersion);
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.validateSubProjects();
    this.updateWorkspace();
    this.installNonNodeDependencies();
    this.resolveLocalBunDependencies();

    // Disable node warnings if configured
    if (this._options.disableNodeWarnings) {
      this.disableNodeWarnings();
    }

    // Prevent sub NodeProject packages from `postSynthesis` which will cause individual/extraneous installs.
    // The workspace package install will handle all the sub NodeProject packages automatically.
    this.subprojects.forEach((subProject) => {
      if (NodePackageUtils.isNodeProject(subProject)) {
        const subNodeProject: NodeProject = subProject as NodeProject;
        const subNodeProjectResolver =
          // @ts-ignore - `resolveDepsAndWritePackageJson` is private
          subNodeProject.package.resolveDepsAndWritePackageJson;
        // @ts-ignore - `installDependencies` is private
        subNodeProject.package.installDependencies = () => {
          this.subNodeProjectResolves.push(() =>
            subNodeProjectResolver.apply(subNodeProject.package)
          );
        };
        // @ts-ignore - `resolveDepsAndWritePackageJson` is private
        subNodeProject.package.resolveDepsAndWritePackageJson = () => {};
      }
    });

    this.nxConfigurator.synth();
    super.synth();
  }

  /**
   * @inheritDoc
   */
  postSynthesize(): void {
    super.postSynthesize();
    this.resolveSubNodeProjects();
  }

  /**
   * Resolve sub `NodePackage` dependencies.
   */
  private resolveSubNodeProjects() {
    if (this.subNodeProjectResolves.length) {
      if (!this.package.file.changed) {
        // Force workspace install deps since it would not have been invoked during `postSynthesis`.
        // @ts-ignore - `installDependencies` is private
        this.package.installDependencies();
      }
      const completedResolves = this.subNodeProjectResolves.map((resolve) =>
        resolve()
      );
      if (completedResolves.some(Boolean)) {
        // Indicates that a subproject dependency has been resolved from '*', so update the lockfile.
        // @ts-ignore - `installDependencies` is private
        this.package.installDependencies();
      }
    }
    this.subNodeProjectResolves = [];
  }

  /**
   * Ensures subprojects don't have a default task and that all packages use the same package manager.
   */
  private validateSubProjects() {
    this.subprojects.forEach((subProject: any) => {
      // Disable default task on subprojects as this isn't supported in a monorepo
      subProject.defaultTask?.reset();

      if (
        NodePackageUtils.isNodeProject(subProject) &&
        subProject.package.packageManager !== this.package.packageManager
      ) {
        throw new Error(
          `${subProject.name} packageManager does not match the monorepo packageManager: ${this.package.packageManager}.`
        );
      }
    });
  }

  /**
   * Add a submodule entry to the appropriate workspace file.
   */
  private updateWorkspace() {
    // A final call to addWorkspacePackages will update the list of workspace packages with any subprojects that have
    // not yet been added, in the correct order
    this.addWorkspacePackages();

    let noHoist = this.workspaceConfig?.yarn?.noHoist;
    // Automatically add all sub-project "bundledDependencies" to workspace "hohoist", otherwise they are not bundled in npm package
    if (
      this.workspaceConfig?.yarn?.disableNoHoistBundled !== true &&
      [
        NodePackageManager.YARN,
        NodePackageManager.YARN2,
        NodePackageManager.YARN_BERRY,
        NodePackageManager.YARN_CLASSIC,
      ].includes(this.package.packageManager)
    ) {
      const noHoistBundled = this.subprojects.flatMap((sub) => {
        if (ProjectUtils.isNamedInstanceOf(sub, NodeProject)) {
          return getBundledDeps(sub).flatMap((dep) => [
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
    }
    this.package.addField("workspaces", {
      packages: this.workspacePackages,
      nohoist: noHoist,
    });
  }

  /**
   * Ensures the install task for non-node projects is executed postinstall.
   *
   * @private
   */
  private installNonNodeDependencies() {
    const installProjects = this.subprojects.filter(
      (project) =>
        !ProjectUtils.isNamedInstanceOf(project, NodeProject) &&
        project.tasks.tryFind("install")
    );

    if (installProjects.length > 0) {
      // TODO: Install error on clean repo for postinstall (https://cloud.nx.app/runs/MptQr0BxgF) (https://github.com/nrwl/nx/issues/11210)
      const postinstallTask =
        this.tasks.tryFind("postinstall") ?? this.addTask("postinstall");

      const nxRunManyInstall = this.composeNxRunManyCommand({
        target: "install",
        projects: installProjects.map((project) => project.name),
        parallel: 1,
      });

      postinstallTask.exec(
        NodePackageUtils.command.exec(
          this.package.packageManager,
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
   * Suppress Node warnings from being presented in the console when running builds.
   */
  private disableNodeWarnings() {
    this.tasks.addEnvironment("NODE_NO_WARNINGS", "1");
    this.subprojects.forEach((subProject) =>
      subProject.tasks.addEnvironment("NODE_NO_WARNINGS", "1")
    );
  }

  /**
   * Resolve all local workspace dependencies to keep bun happy.
   */
  private resolveLocalBunDependencies(): void {
    if (this.package.packageManager !== NodePackageManager.BUN) {
      return;
    }

    const nodeSubProjectNames = new Set(
      this.subprojects
        .filter((s) => NodePackageUtils.isNodeProject(s))
        .map((s) => (s as NodeProject).package.packageName)
    );

    this.subprojects.forEach((subProject) => {
      if (NodePackageUtils.isNodeProject(subProject)) {
        subProject.deps.all
          .filter((dep) => nodeSubProjectNames.has(dep.name))
          .forEach((d) => {
            switch (d.type) {
              case DependencyType.RUNTIME:
                subProject.addDeps(`${d.name}@workspace:*`);
                break;
              case DependencyType.BUILD:
                subProject.addDevDeps(`${d.name}@workspace:*`);
                break;
              case DependencyType.PEER:
                subProject.addPeerDeps(`${d.name}@workspace:*`);
                break;
              default:
                console.warn(
                  `Cannot update local dependency due to unsupported type: ${d.type}`
                );
            }
          });
      }
    });
  }
}

/**
 * Gets bundled dependencies for a given project
 */
function getBundledDeps(project: Project): Dependency[] {
  return project.deps.all.filter((dep) => dep.type === DependencyType.BUNDLED);
}
