/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
// This file was forked form https://github.com/JamieMason/syncpack/blob/master/src/constants.ts (v8.2.4)
export type DependencyType =
  | "dependencies"
  | "devDependencies"
  | "overrides"
  | "peerDependencies"
  | "pnpmOverrides"
  | "resolutions"
  | "workspace";

export type ValidRange =
  | typeof RANGE_ANY
  | typeof RANGE_EXACT
  | typeof RANGE_GT
  | typeof RANGE_GTE
  | typeof RANGE_LOOSE
  | typeof RANGE_LT
  | typeof RANGE_LTE
  | typeof RANGE_MINOR
  | typeof RANGE_PATCH;

export interface SemverGroup {
  /**
   * the names of packages in your monorepo which belong to this group, taken
   * from the "name" field in package.json, not the package directory name
   */
  readonly packages: string[];
  /**
   * the names of the dependencies (eg. "lodash") which belong to this group
   */
  readonly dependencies: string[];
  /**
   * the semver range which dependencies in this group should use
   */
  readonly range: ValidRange;
  /**
   * optionally only apply this group to dependencies of the provided types
   */
  readonly dependencyTypes?: DependencyType[];
}

export interface VersionGroup {
  /**
   * the names of packages in your monorepo which belong to this group, taken
   * from the "name" field in package.json, not the package directory name
   */
  readonly packages: string[];
  /**
   * the names of the dependencies (eg. "lodash") which belong to this group
   */
  readonly dependencies: string[];
  /**
   * optionally force all dependencies in this group to be removed
   */
  readonly isBanned?: true;
  /**
   * optionally force all dependencies in this group to have this version
   */
  readonly pinVersion?: string;
  /**
   * optionally only apply this group to dependencies of the provided types
   */
  readonly dependencyTypes?: DependencyType[];
}

export interface SyncpackConfig {
  /**
   * which dependency properties to search within
   */
  readonly dependencyTypes: DependencyType[];
  /**
   * whether to search within devDependencies
   */
  readonly dev: boolean;
  /**
   * a string which will be passed to `new RegExp()` to match against package
   * names that should be included
   */
  readonly filter: string;
  /**
   * the character(s) to be used to indent your package.json files when writing
   * to disk
   */
  readonly indent: string;
  /**
   * whether to search within npm overrides
   */
  readonly overrides: boolean;
  /**
   * whether to search within peerDependencies
   */
  readonly peer: boolean;
  /**
   * whether to search within pnpm overrides
   */
  readonly pnpmOverrides: boolean;
  /**
   * whether to search within dependencies
   */
  readonly prod: boolean;
  /**
   * whether to search within yarn resolutions
   */
  readonly resolutions: boolean;
  /**
   *
   */
  readonly semverGroups: SemverGroup[];
  /**
   * defaults to `""` to ensure that exact dependency versions are used instead
   * of loose ranges
   */
  readonly semverRange: ValidRange;
  /**
   * which fields within package.json files should be sorted alphabetically
   */
  readonly sortAz: string[];
  /**
   * which fields within package.json files should appear at the top, and in
   * what order
   */
  readonly sortFirst: string[];
  /**
   * glob patterns for package.json file locations
   */
  readonly source: string[];
  /**
   *
   */
  readonly versionGroups: VersionGroup[];
  /**
   * whether to include the versions of the `--source` packages developed in
   * your workspace/monorepo as part of the search for versions to sync
   */
  readonly workspace: boolean;
}

export const RANGE_ANY = "*";
export const RANGE_EXACT = "";
export const RANGE_GT = ">";
export const RANGE_GTE = ">=";
export const RANGE_LOOSE = ".x";
export const RANGE_LT = "<";
export const RANGE_LTE = "<=";
export const RANGE_MINOR = "^";
export const RANGE_PATCH = "~";

export const DEFAULT_CONFIG: SyncpackConfig = {
  dependencyTypes: [],
  dev: true,
  filter: ".",
  indent: "  ",
  overrides: true,
  peer: true,
  pnpmOverrides: true,
  prod: true,
  resolutions: true,
  workspace: true,
  semverGroups: [],
  semverRange: "",
  sortAz: [
    "contributors",
    "dependencies",
    "devDependencies",
    "keywords",
    "peerDependencies",
    "resolutions",
    "scripts",
  ],
  sortFirst: ["name", "description", "version", "author"],
  source: [],
  versionGroups: [],
};
