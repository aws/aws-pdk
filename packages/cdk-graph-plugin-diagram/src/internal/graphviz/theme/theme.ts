/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { aws_arch } from "@aws-pdk/aws-arch";
// @ts-ignore - just used for jsdoc type link, but errors as unused
import type { Graph } from "@aws-pdk/cdk-graph";

/** Icon rendering target options for GraphTheme */
export enum GraphThemeRenderingIconTarget {
  /**
   * Data icon (eg: EC2 instance type icon, T2).
   *
   * Resolution precedence: `data => resource => general => service => category`
   * @default
   */
  DATA = 0,
  /**
   * Resource icon.
   *
   * Resolution precedence: `resource => general => service => category`
   */
  RESOURCE = 1,
  /**
   * General icon.
   *
   * Resolution precedence: `resource => general => service => category`
   */
  GENERAL = 2,
  /**
   * Service icon.
   *
   * Resolution precedence: `service => category`
   */
  SERVICE = 3,
  /**
   * Category icon.
   *
   * Resolution precedence: `category`
   */
  CATEGORY = 4,
}

/** Icon specific properties for configuring graph rendering of resource icons. */
export interface IGraphThemeRenderingIconProps {
  /** Lowest Graph.ResourceNode icon to render */
  readonly resourceIconMin?: GraphThemeRenderingIconTarget;
  /** Highest Graph.ResourceNode icon to render */
  readonly resourceIconMax?: GraphThemeRenderingIconTarget;
  /** Lowest Graph.CfnResourceNode icon to render */
  readonly cfnResourceIconMin?: GraphThemeRenderingIconTarget;
  /** Highest Graph.CfnResourceNode icon to render */
  readonly cfnResourceIconMax?: GraphThemeRenderingIconTarget;
}

/** Additional graph rendering options */
export interface IGraphThemeRenderingOptions {
  /**
   * Prevent cross-cluster edges from ranking nodes in layout.
   * @see https://graphviz.org/docs/attrs/constraint/
   * @default false
   */
  readonly unconstrainedCrossClusterEdges?: boolean;

  /**
   * Layout direction of the graph.
   * @default horizontal
   */
  readonly layout?: "horizontal" | "vertical";

  /**
   * Specify which stage to render when multiple stages are available.
   *
   * Can be a preset value of "first", "last", and "all", or regex string of the stage(s) to render.
   *
   * @default last
   */
  readonly stage?: "first" | "last" | "all" | string;

  /**
   * Specify regex pattern to match root stacks to render.
   *
   * @default undefined Will render all stacks
   */
  readonly stack?: string;
}

/** Properties for defining the rendering options for the graph theme. */
export interface IGraphThemeRendering
  extends IGraphThemeRenderingIconProps,
    IGraphThemeRenderingOptions {}

/** GraphThemeConfigAlt is simplified definition of theme to apply */
export interface IGraphThemeConfigAlt {
  readonly theme?: aws_arch.Themes;
  readonly rendering?: IGraphThemeRendering;
}

export type GraphThemeConfigProp = aws_arch.Themes | IGraphThemeConfigAlt;
