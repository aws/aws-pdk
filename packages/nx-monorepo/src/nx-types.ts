/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

import { Obj } from "projen/lib/util";

export namespace Nx {
  /**
   * Configuration for nx targetDependencies.
   */
  export type ITargetDependencies = { [target: string]: ITargetDependency[] };

  /**
   * Configuration for project specific targets.
   */
  export type IProjectTargets = { [target: string]: IProjectTarget };

  export interface IInput {
    fileset?: string;
    runtime?: string;
    env?: string;
  }

  export type Inputs = (string | IInput)[];

  export type Outputs = string[];

  /**
   * Project Target.
   */
  export interface IProjectTarget {
    /**
     * List of inputs to hash for cache key, relative to the root of the monorepo.
     *
     * note: must start with leading /
     */
    inputs?: Inputs;
    /**
     * List of outputs to cache, relative to the root of the monorepo.
     *
     * note: must start with leading /
     */
    outputs?: string[];

    /**
     * List of Target Dependencies.
     */
    dependsOn?: (string | ITargetDependency)[];

    /**
     * The function that Nx will invoke when you run this target
     */
    executor?: string;

    /**
     * Contains whatever configuration properties the executor needs to run.
     */
    options?: any;
  }

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
  export interface ITargetDependency {
    /**
     * Projen target i.e: build, test, etc
     */
    target: string;

    /**
     * Target dependencies.
     */
    projects: TargetDependencyProject;
  }

  /**
   * Named inputs config
   * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
   */
  export interface INamedInputs {
    /**
     * @jsii ignore
     */
    [name: string]: string[];
  }

  /**
   * Target defaults config
   * @see https://nx.dev/reference/nx-json#target-defaults
   */
  export interface ITargetDefaults {
    /**
     * @jsii ignore
     */
    [name: string]: IProjectTarget;
  }

  /**
   * Default options for `nx affected`
   * @see https://github.com/nrwl/nx/blob/065477610605d5799babc3ba78f26cdfe8737250/packages/nx/src/config/nx-json.ts#L16
   */
  export interface INxAffectedConfig {
    /** Default based branch used by affected commands. */
    defaultBase?: string;
  }

  /**
   * Where new apps + libs should be placed
   */
  export interface IWorkspaceLayout {
    libsDir: string;
    appsDir: string;
  }

  /**
   * @see https://nx.dev/reference/nx-json
   * @see https://github.com/nrwl/nx/blob/master/packages/nx/src/config/nx-json.ts
   */
  export interface NxJsonConfiguration {
    /**
     * Some presets use the extends property to hide some default options in a separate json file.
     * The json file specified in the extends property is located in your node_modules folder.
     * The Nx preset files are specified in the nx package.
     *
     * @default "nx/presets/npm.json"
     */
    readonly extends?: string;

    /**
     * Tells Nx what prefix to use when generating library imports.
     */
    readonly npmScope?: string;

    /**
     * Named inputs
     * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
     */
    readonly namedInputs?: INamedInputs;

    /**
     * Default options for `nx affected`
     */
    readonly affected?: INxAffectedConfig;

    /**
     * Dependencies between different target names across all projects
     *
     * @see https://nx.dev/reference/nx-json#target-defaults
     */
    readonly targetDefaults?: ITargetDefaults;

    /**
     * Where new apps + libs should be placed
     */
    readonly workspaceLayout?: IWorkspaceLayout;

    /**
     * Available Task Runners
     */
    readonly tasksRunnerOptions?: Obj<any>;

    /**
     * Plugins for extending the project graph
     */
    readonly plugins?: string[];

    /**
     * Configuration for Nx Plugins
     */
    readonly pluginsConfig?: Obj<any>;

    /**
     * Default project. When project isn't provided, the default project
     * will be used. Convenient for small workspaces with one main application.
     */
    readonly defaultProject?: string;
  }

  /**
   * NX workspace configurations.
   *
   * @see https://nx.dev/configuration/packagejson
   */
  export interface WorkspaceConfig {
    /**
     * List of patterns to include in the .nxignore file.
     *
     * @see https://nx.dev/configuration/packagejson#nxignore
     */
    readonly nxIgnore?: string[];

    /**
     * Defines the list of targets/operations that are cached by Nx
     *
     * @default ["build", "test"]
     * @see https://nx.dev/reference/nx-json#tasks-runner-options
     */
    readonly cacheableOperations?: string[];

    readonly defaultBuildOutputs?: string[];

    /**
     * Read only access token if enabling nx cloud.
     */
    readonly nxCloudReadOnlyAccessToken?: string;

    /**
     * Use non-native hasher for nx tasks.
     *
     * Sets `NX_NON_NATIVE_HASHER=true` environment variable on nx based tasks.
     * @see https://github.com/nrwl/nx/pull/15071
     */
    readonly nonNativeHasher?: boolean;

    // nxJson?: INxJson;
  }

  /**
   * @see https://github.com/nrwl/nx/blob/master/packages/nx/schemas/project-schema.json
   */
  export interface ProjectConfig {
    /**
     * Named inputs
     * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
     */
    readonly namedInputs?: INamedInputs;

    /**
     * Targets configuration
     * @see https://nx.dev/reference/project-configuration
     */
    readonly targets?: IProjectTargets;

    /**
     * Project tag annotations
     *
     * @see https://nx.dev/reference/project-configuration#tags
     */
    readonly tags?: string[];

    /**
     * Implicit dependencies
     *
     * @see https://nx.dev/reference/project-configuration#implicitdependencies
     */
    readonly implicitDependencies?: string[];

    /**
     * Explicit list of scripts for Nx to include.
     * @see https://nx.dev/reference/project-configuration#ignoring-package.json-scripts
     */
    readonly includedScripts?: string[];
  }

  /**
   *
   * @see https://nx.dev/packages/nx/documents/run-many#options
   */
  export interface RunManyOptions {
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
}
