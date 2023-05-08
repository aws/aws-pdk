/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
export namespace Nx {
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
     * List of inputs to hash for cache key, relative to the root of the monorepo.
     *
     * note: must start with leading /
     */
    readonly inputs?: string[];
    /**
     * List of outputs to cache, relative to the root of the monorepo.
     *
     * note: must start with leading /
     */
    readonly outputs?: string[];

    /**
     * List of Target Dependencies.
     */
    readonly dependsOn?: TargetDependency[];
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
   * Named inputs config
   * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
   */
  export interface NamedInputs {
    /**
     * @jsii ignore
     */
    readonly [name: string]: string[];
  }

  /**
   * Target defaults config
   * @see https://nx.dev/reference/nx-json#target-defaults
   */
  export interface TargetDefaults {
    /**
     * @jsii ignore
     */
    readonly [name: string]: ProjectTarget;
  }

  /**
   * NX workspace configurations.
   *
   * @see https://nx.dev/configuration/packagejson
   */
  export interface WorkspaceConfig {
    /**
     * Affected branch.
     *
     * @default mainline
     */
    readonly affectedBranch?: string;

    /**
     * Configuration for TargetDependencies.
     *
     * @see https://nx.dev/configuration/packagejson#target-dependencies
     */
    readonly targetDependencies?: TargetDependencies;

    /**
     * List of patterns to include in the .nxignore file.
     *
     * @see https://nx.dev/configuration/packagejson#nxignore
     */
    readonly nxIgnore?: string[];

    /**
     * Read only access token if enabling nx cloud.
     */
    readonly nxCloudReadOnlyAccessToken?: string;

    /**
     * Defines the list of targets/operations that are cached by Nx
     *
     * @default ["build", "test"]
     * @see https://nx.dev/reference/nx-json#tasks-runner-options
     */
    readonly cacheableOperations?: string[];

    /**
     * Named inputs
     * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
     */
    readonly namedInputs?: NamedInputs;

    /**
     * Target defaults
     *
     * @see https://nx.dev/reference/nx-json#target-defaults
     */
    readonly targetDefaults?: TargetDefaults;

    /**
     * Use non-native hasher for nx tasks.
     *
     * Sets `NX_NON_NATIVE_HASHER=true` environment variable on nx based tasks.
     * @see https://github.com/nrwl/nx/pull/15071
     */
    readonly nonNativeHasher?: boolean;
  }

  export interface ProjectConfig {
    /**
     * Named inputs
     * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
     */
    readonly namedInputs?: NamedInputs;

    /**
     * Targets configuration
     * @see https://nx.dev/reference/project-configuration
     */
    readonly targets?: ProjectTargets;

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
}
