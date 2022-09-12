/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

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
 * Options for the smithy build file
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
}
