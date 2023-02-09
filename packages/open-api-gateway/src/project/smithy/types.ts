/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/**
 * A smithy build transform
 */
export interface SmithyTransform {
  /**
   * Name of the transform
   */
  readonly name: string;
  /**
   * Arguments for the transform
   */
  readonly args: Record<string, any>;
}

/**
 * Properties common to smithy plugins and the root smithy build
 */
export interface SmithyCommon {
  /**
   * List of imports
   */
  readonly imports?: string[];
  /**
   * Plugins keyed by plugin id
   */
  readonly plugins?: SmithyPlugins;
}

/**
 * A smithy plugin
 */
export interface SmithyPlugin {
  /**
   * The service to which the plugin should apply
   */
  readonly service?: string;
  /**
   * Other plugin settings
   */
  readonly [key: string]: any;
}

/**
 * A smithy build projection
 */
export interface SmithyProjection extends SmithyCommon {
  /**
   * Whether or not the projection is abstract
   */
  readonly abstract?: boolean;
  /**
   * Transforms to apply to the projection
   */
  readonly transforms?: SmithyTransform[];
}

/**
 * Projection key, used to uniquely identify the projection
 */
export type SmithyProjectionKey = string;
/**
 * Projections keyed by id
 */
export type SmithyProjections = Record<SmithyProjectionKey, SmithyProjection>;
/**
 * Plugin key, used to uniquely identify the plugin
 */
export type SmithyPluginKey = string;
/**
 * Plugins keyed by id
 */
export type SmithyPlugins = Record<SmithyPluginKey, SmithyPlugin>;

/**
 * Configuration for smithy maven dependencies
 */
export interface SmithyMavenConfiguration {
  /**
   * The dependencies used in the build.gradle and smithy-build.json files
   * eg. software.amazon.smithy:smithy-validation-model:1.27.2
   * The following required dependencies are always added:
   * - software.amazon.smithy:smithy-cli:1.27.2
   * - software.amazon.smithy:smithy-model:1.27.2
   * - software.amazon.smithy:smithy-openapi:1.27.2
   * - software.amazon.smithy:smithy-aws-traits:1.27.2
   * You can however override the version of these dependencies if required.
   */
  readonly dependencies?: string[];
  /**
   * The repository urls used in the build.gradle and smithy-build.json files
   * @default maven central and maven local
   */
  readonly repositoryUrls?: string[];
}

/**
 * Options for the smithy build files
 */
export interface SmithyBuildOptions extends SmithyCommon {
  /**
   * Map of projections name to projection configurations
   * https://awslabs.github.io/smithy/2.0/guides/building-models/build-config.html#projections
   * @default - no projections
   */
  readonly projections?: SmithyProjections;
  /**
   * If a plugin can't be found, Smithy will by default fail the build.
   * This setting can be set to true to allow the build to progress
   * even if a plugin can't be found on the classpath.
   *
   * @default - no ignoreMissingPlugins set in the smithy-build.json file
   */
  readonly ignoreMissingPlugins?: boolean;
  /**
   * Maven configuration for the Smithy build project, used to specify dependencies and repositories in the build.gradle
   * and smithy-build.json files.
   * @default the default configuration required for Smithy to OpenAPI conversion
   */
  readonly maven?: SmithyMavenConfiguration;
}
