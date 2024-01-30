/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

// JSII compatible fork of types from https://github.com/JamieMason/syncpack/blob/main/src/config/types.ts (v12.3.0)

/**
 * Types and constants for Syncpack usage in the monorepo
 * @see https://jamiemason.github.io/syncpack
 */
export namespace Syncpack {
  /**
   * Aliases for semver range formats supported by syncpack
   *
   * Defaults to `""` to ensure that exact dependency versions are used instead of
   * loose ranges, but this can be overridden in your config file.
   *
   * | Supported Range |   Example |
   * | --------------- | --------: |
   * | `"<"`           |  `<1.4.2` |
   * | `"<="`          | `<=1.4.2` |
   * | `""`            |   `1.4.2` |
   * | `"~"`           |  `~1.4.2` |
   * | `"^"`           |  `^1.4.2` |
   * | `">="`          | `>=1.4.2` |
   * | `">"`           |  `>1.4.2` |
   * | `"*"`           |       `*` |
   *
   * @default ""
   */
  export type SemverRange =
    | ""
    | "*"
    | ">"
    | ">="
    | ".x"
    | "<"
    | "<="
    | "^"
    | "~"
    | "workspace:";

  export const CUSTOM_TYPES = {
    dev: {
      strategy: "versionsByName",
      path: "devDependencies",
    },
    local: {
      strategy: "name~version",
      namePath: "name",
      path: "version",
    },
    overrides: {
      strategy: "versionsByName",
      path: "overrides",
    },
    peer: {
      strategy: "versionsByName",
      path: "peerDependencies",
    },
    pnpmOverrides: {
      strategy: "versionsByName",
      path: "pnpm.overrides",
    },
    prod: {
      strategy: "versionsByName",
      path: "dependencies",
    },
    resolutions: {
      strategy: "versionsByName",
      path: "resolutions",
    },
  } as const;

  type DefaultDependencyType = keyof typeof CUSTOM_TYPES;

  export type DependencyType =
    | DefaultDependencyType
    | `!${DefaultDependencyType}`
    // This is done to allow any other `string` while also offering intellisense
    // for the internal dependency types above. `(string & {})` is needed to
    // prevent typescript from ignoring these specific strings and merging them
    // all into `string`, where we'd lose any editor autocomplete for the other
    // more specific fields, using (string & {}) stops that from happening.
    //
    // eslint-disable-next-line @typescript-eslint/ban-types
    | (string & {});

  // NB: for brevity we use "string" instead of re-defining all the different specifier types here:
  // https://github.com/JamieMason/syncpack/blob/db2b31ccdb1a28fdbe0c42d27ce956ea5c6c543a/src/specifier/index.ts#L16-L27
  export type SpecifierType = string;

  export interface GroupConfig {
    readonly dependencies?: string[];
    readonly dependencyTypes?: DependencyType[];
    readonly label?: string;
    readonly packages?: string[];
    readonly specifierTypes?: SpecifierType[];
  }

  export namespace SemverGroupConfig {
    export interface Disabled extends GroupConfig {
      readonly isDisabled: true;
    }

    export interface Ignored extends GroupConfig {
      readonly isIgnored: true;
    }

    export interface WithRange extends GroupConfig {
      readonly range: SemverRange;
    }

    export type Any = Disabled | Ignored | WithRange;
  }

  export namespace VersionGroupConfig {
    export interface Banned extends GroupConfig {
      readonly isBanned: true;
    }

    export interface Ignored extends GroupConfig {
      readonly isIgnored: true;
    }

    export interface Pinned extends GroupConfig {
      readonly pinVersion: string;
    }

    export interface SnappedTo extends GroupConfig {
      readonly snapTo: string[];
    }

    export interface SameRange extends GroupConfig {
      readonly policy: "sameRange";
    }

    export interface SnappedTo extends GroupConfig {
      readonly snapTo: string[];
    }

    export interface Standard extends GroupConfig {
      readonly preferVersion?: "highestSemver" | "lowestSemver";
    }

    export type Any =
      | Banned
      | Ignored
      | Pinned
      | SameRange
      | SnappedTo
      | Standard;
  }

  export namespace CustomTypeConfig {
    export interface NameAndVersionProps {
      readonly namePath: string;
      readonly path: string;
      readonly strategy: "name~version";
    }

    export interface NamedVersionString {
      readonly path: string;
      readonly strategy: "name@version";
    }

    export interface UnnamedVersionString {
      readonly path: string;
      readonly strategy: "version";
    }

    export interface VersionsByName {
      readonly path: string;
      readonly strategy: "versionsByName";
    }

    export type Any =
      | NameAndVersionProps
      | NamedVersionString
      | UnnamedVersionString
      | VersionsByName;
  }

  export interface CliConfig {
    readonly configPath?: string;
    readonly filter: string;
    readonly indent: string;
    readonly source: string[];
    readonly specs: string;
    readonly types: string;
  }

  /**
   * Configuration for Syncpack
   * @see https://jamiemason.github.io/syncpack
   */
  export interface SyncpackConfig {
    /** @see https://jamiemason.github.io/syncpack/config/custom-types */
    readonly customTypes?: Record<string, CustomTypeConfig.Any>;
    /** @see https://jamiemason.github.io/syncpack/config/dependency-types */
    readonly dependencyTypes?: DependencyType[];
    /** @see https://jamiemason.github.io/syncpack/config/filter */
    readonly filter?: string;
    /** @see https://jamiemason.github.io/syncpack/config/format-bugs */
    readonly formatBugs?: boolean;
    /** @see https://jamiemason.github.io/syncpack/config/format-repository */
    readonly formatRepository?: boolean;
    /** @see https://jamiemason.github.io/syncpack/config/indent */
    readonly indent?: string;
    /** @see https://jamiemason.github.io/syncpack/config/lint-formatting */
    readonly lintFormatting?: boolean;
    /** @see https://jamiemason.github.io/syncpack/config/lint-semver-ranges */
    readonly lintSemverRanges?: boolean;
    /** @see https://jamiemason.github.io/syncpack/config/lint-versions */
    readonly lintVersions?: boolean;
    /** @see https://jamiemason.github.io/syncpack/config/semver-groups */
    readonly semverGroups?: SemverGroupConfig.Any[];
    /** @see https://jamiemason.github.io/syncpack/config/sort-az */
    readonly sortAz?: string[];
    /** @see https://jamiemason.github.io/syncpack/config/sort-exports */
    readonly sortExports?: string[];
    /** @see https://jamiemason.github.io/syncpack/config/sort-first */
    readonly sortFirst?: string[];
    /** @see https://jamiemason.github.io/syncpack/config/sort-packages */
    readonly sortPackages?: boolean;
    /** @see https://jamiemason.github.io/syncpack/config/source */
    readonly source?: string[];
    /** @see https://jamiemason.github.io/syncpack/config/specifier-types */
    readonly specifierTypes?: SpecifierType[];
    /** @see https://jamiemason.github.io/syncpack/config/version-groups */
    readonly versionGroups?: VersionGroupConfig.Any[];
  }

  /**
   * Default monorepo configuration for Syncpack
   * @see https://jamiemason.github.io/syncpack/
   */
  export const DEFAULT_CONFIG: Syncpack.SyncpackConfig = {
    filter: ".",
    indent: "  ",
    semverGroups: [
      {
        dependencies: ["**"],
        dependencyTypes: ["**"],
        packages: ["**"],
        range: "",
      },
    ],
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
}
