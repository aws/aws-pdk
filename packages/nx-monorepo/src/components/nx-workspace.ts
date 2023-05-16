/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  Component,
  DependencyType,
  IgnoreFile,
  JsonFile,
  Project,
} from "projen";
import { Obj } from "projen/lib/util";
import { Nx } from "../nx-types";
import { asUndefinedIfEmpty, deepMerge } from "../utils/common";

const ALWAYS_IGNORE: string[] = [".tmp", ".env", ".pytest_cache"];

/** Default NX outputs to cache */
export const NX_DEFAULT_BUILD_OUTPUTS = [
  "{projectRoot}/dist",
  "{projectRoot}/lib",
  "{projectRoot}/build",
  "{projectRoot}/coverage",
  "{projectRoot}/test-reports",
  "{projectRoot}/target",
  "{projectRoot}/cdk.out",
  "{projectRoot}/LICENSE_THIRD_PARTY",
  "{projectRoot}/.jsii",
];

/** Project callback */
export interface ProjectCallback {
  (project: Project): void;
}
/** Project predicate callback */
export interface ProjectPredicateCallback {
  (project: Project): boolean;
}

/**
 * Component which manages the workspace specific NX Config for the root monorepo.
 * @experimental
 */
export class NxWorkspace extends Component {
  /**
   * Retrieves the singleton instance associated with project root.
   *
   * @param scope project instance.
   */
  static of(scope: Project): NxWorkspace | undefined {
    return scope.root.components.find((c) => c instanceof NxWorkspace) as
      | NxWorkspace
      | undefined;
  }

  /**
   * Raw nx.json file to support overrides that aren't handled
   * directly.
   *
   * **Attention:** any overrides applied here will not be visible
   * in the properties and only included in final synthesized output,
   * and likely to override native handling.
   * @advanced
   */
  public readonly nxJson: JsonFile;
  /**
   * .nxignore file
   */
  public readonly nxIgnore: IgnoreFile;

  /**
   * Automatically infer NxProject targets based on project type.
   * @experimental
   */
  public autoInferProjectTargets: boolean = false;

  /**
   * Override the default nx cacheDirectory
   * @experimental May cause `Could not find 'nx' module in this workspace.` [issue](https://github.com/nrwl/nx/issues/8929). If you experience this issue, please remove `cacheDirectory` override.
   */
  public cacheDirectory?: string;

  /**
   * Indicates if non-native nx hasher will be used.
   *
   * If true, the NX_NON_NATIVE_HASHER env var will be set
   * to true for all project tasks.
   */
  public nonNativeHasher: boolean = false;
  /**
   * List of cacheable operations.
   */
  public cacheableOperations: string[] = ["build", "test"];

  /**
   * Some presets use the extends property to hide some default options in a separate json file.
   * The json file specified in the extends property is located in your node_modules folder.
   * The Nx preset files are specified in the nx package.
   *
   * @default "nx/presets/npm.json"
   */
  public extends: string = "nx/presets/npm.json";
  /**
   * Tells Nx what prefix to use when generating library imports.
   */
  public npmScope: string = "monorepo";
  /**
   * Where new apps + libs should be placed
   */
  public workspaceLayout?: Nx.IWorkspaceLayout;
  /**
   * Plugins for extending the project graph
   */
  public plugins: string[] = [];
  /**
   * Configuration for Nx Plugins
   */
  public pluginsConfig: Obj<any> = {};
  /**
   * Default options for `nx affected`
   */
  public affected: Nx.INxAffectedConfig = {
    defaultBase: "mainline",
  };
  /**
   * Named inputs
   * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
   */
  public namedInputs: Nx.INamedInputs = {
    // https://nx.dev/more-concepts/customizing-inputs#defaults
    default: ["{projectRoot}/**/*"],
  };
  /**
   * Dependencies between different target names across all projects
   *
   * @see https://nx.dev/reference/nx-json#target-defaults
   */
  public targetDefaults: Nx.ITargetDefaults = {
    build: {
      inputs: ["default", "^default"],
      outputs: NX_DEFAULT_BUILD_OUTPUTS,
      dependsOn: ["^build"],
    },
  };
  /**
   * Default task runner
   */
  public defaultTaskRunner: string = "nx/tasks-runners/default";
  /**
   * Default task runner options
   */
  public defaultTaskRunnerOptions: Obj<any> = {
    useDaemonProcess: false,
    cacheableOperations: () => this.cacheableOperations,
    cacheDirectory: () => this.cacheDirectory,
  };

  /**
   * Task runner options.
   */
  public tasksRunnerOptions: Obj<any> = {
    default: {
      runner: () => this.defaultTaskRunner,
      options: () => this.defaultTaskRunnerOptions,
    },
  };

  /**
   * Get the default base branch
   * @default "mainline"
   */
  public get baseBranch(): string {
    return this.affected.defaultBase || "mainline";
  }

  constructor(project: Project) {
    // Make sure only being added to the root project.
    if (project.root !== project) {
      throw new Error("NxJson can only be added to the root project");
    }
    // Make sure we only ever have 1 instance of NxJson component per project
    if (NxWorkspace.of(project)) {
      throw new Error(
        `Project ${project.name} already has associated NxJson component.`
      );
    }

    if (project.tryFindObjectFile("nx.json")) {
      throw new Error(
        `Project ${project.name} already has "nx.json" file defined.`
      );
    }

    super(project);

    this.nxJson = new JsonFile(project, "nx.json", {
      obj: {
        extends: () => this.extends,
        npmScope: () => this.npmScope,
        affected: () => asUndefinedIfEmpty(this.affected),
        workspaceLayout: () => asUndefinedIfEmpty(this.workspaceLayout),
        plugins: () => asUndefinedIfEmpty(this.plugins),
        pluginsConfig: () => asUndefinedIfEmpty(this.pluginsConfig),
        namedInputs: () => asUndefinedIfEmpty(this.namedInputs),
        targetDefaults: () => asUndefinedIfEmpty(this.targetDefaults),
        tasksRunnerOptions: () => asUndefinedIfEmpty(this.tasksRunnerOptions),
      },
    });

    this.nxIgnore = new IgnoreFile(project, ".nxignore");
    this.nxIgnore.addPatterns(...ALWAYS_IGNORE);
  }

  /**
   * Setup workspace to use nx-cloud
   * @param readOnlyAccessToken
   */
  public useNxCloud(readOnlyAccessToken: string): void {
    this.defaultTaskRunner = "nx-cloud";
    this.defaultTaskRunnerOptions.accessToken = readOnlyAccessToken;

    if (
      this.project.deps.all.find(
        (dep) => dep.type === DependencyType.BUILD && dep.name === "nx-cloud"
      ) == null
    ) {
      this.project.deps.addDependency("nx-cloud", DependencyType.BUILD);
    }
  }

  /**
   * Set `namedInput` value helper
   */
  public setNamedInput(name: string, inputs: string[]): void {
    this.namedInputs[name] = inputs;
  }

  /** Set `targetDefaults` helper */
  public setTargetDefault(
    name: string,
    target: Nx.IProjectTarget,
    merge: boolean = false
  ): void {
    this.targetDefaults[name] = deepMerge(
      [merge ? this.targetDefaults[name] || {} : {}, target],
      { append: true }
    );
  }

  /**
   * Recursively apply a function to a project and its subprojects.
   * @param project Base project to apply function and recursively  its subprojects
   * @param fn The function to apply to project
   * @param predicate Predicate to match projects to apply function to
   */
  public recursivelyApplyToProject(
    project: Project,
    fn: ProjectCallback,
    predicate?: ProjectPredicateCallback
  ): void {
    (!predicate || predicate(project)) && fn(project);
    this.recursivelyApplyToProjects(project.subprojects, fn, predicate);
  }

  /**
   * Recursively apply a function a list of projects and their subprojects
   * @param projects List of project to apply function and traverse
   * @param fn The function to apply to project
   * @param predicate Predicate to match projects to apply function to
   */
  public recursivelyApplyToProjects(
    projects: Project[],
    fn: ProjectCallback,
    predicate?: ProjectPredicateCallback
  ): void {
    projects.forEach((p) => this.recursivelyApplyToProject(p, fn, predicate));
  }

  /** @internal */
  protected _applyNonNativeHasher(project: Project): void {
    project.tasks.addEnvironment("NX_NON_NATIVE_HASHER", "true");
  }
  /** @internal */
  protected _applyCacheDirectory(project: Project): void {
    this.cacheDirectory &&
      project.tasks.addEnvironment("NX_CACHE_DIRECTORY", this.cacheDirectory);
  }

  /** @inheritdoc */
  preSynthesize(): void {
    super.preSynthesize();

    if (this.cacheDirectory) {
      this.project.logger.warn(
        "[NxWorkspace] Overriding nx cacheDirectory is experimental and may cause `Could not find 'nx' module in this workspace.` issue. \nIf you experience this issue, please remove cacheDirectory override. \nhttps://github.com/nrwl/nx/issues/8929"
      );
      this.project.addGitIgnore(this.cacheDirectory);
      // https://github.com/nrwl/nx/issues/8929
      // For cacheDirectory override to propagate during initialization we need to set as env var
      this.recursivelyApplyToProject(
        this.project,
        this._applyCacheDirectory.bind(this)
      );
    }

    if (this.nonNativeHasher) {
      this.recursivelyApplyToProject(
        this.project,
        this._applyNonNativeHasher.bind(this)
      );
    }
  }

  /** @inheritdoc */
  synthesize() {
    super.synthesize();
  }
}
