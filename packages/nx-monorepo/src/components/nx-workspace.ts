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

export const ALWAYS_IGNORE: string[] = [".tmp", ".env", ".pytest_cache"];

// Default NX outputs to cache
export const NX_DEFAULT_BUILD_OUTPUTS = [
  "{projectRoot}/dist",
  "{projectRoot}/lib",
  "{projectRoot}/build",
  "{projectRoot}/coverage",
  "{projectRoot}/test-reports",
  "{projectRoot}/target",
  "{projectRoot}/LICENSE_THIRD_PARTY",
  "{projectRoot}/.jsii",
];

/**
 * Component which manged the workspace specific NX Config for the root monorepo.
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
   * @internal
   */
  public _autoInferProjectTargets: boolean = false;

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
  /** @internal */
  protected _applyNonNativeHasher(project: Project): void {
    project.tasks.addEnvironment("NX_NON_NATIVE_HASHER", "true");
  }

  /** @inheritdoc */
  preSynthesize(): void {
    super.preSynthesize();

    if (this.nonNativeHasher) {
      this._applyNonNativeHasher(this.project);

      this.project.subprojects.forEach(this._applyNonNativeHasher);
    }
  }

  /** @inheritdoc */
  synthesize() {
    super.synthesize();
  }
}
