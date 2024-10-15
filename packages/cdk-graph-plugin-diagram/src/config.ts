/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { FilterPreset, IGraphFilterPlan } from "@aws/cdk-graph";
import { GraphThemeConfigProp } from "./internal/graphviz";

/**
 * Supported diagram formats that can be generated.
 *
 * Extended formats are automatically generated, for example if you generate "png" which extends
 * "svg" which extends "dot", the resulting generated files will be all aforementioned.
 */
export enum DiagramFormat {
  /**
   * Graphviz [DOT Language](https://graphviz.org/doc/info/lang.html)
   *
   * @default
   */
  DOT = "dot",
  /**
   * [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) generated
   * using [dot-wasm](https://hpcc-systems.github.io/hpcc-js-wasm/classes/graphviz.Graphviz.html)
   * from {@link DiagramFormat.DOT} file.
   *
   * @extends {DiagramFormat.DOT}
   */
  SVG = "svg",
  /**
   * [PNG](https://en.wikipedia.org/wiki/Portable_Network_Graphics) generated
   * using [sharp](https://sharp.pixelplumbing.com/api-output#png) from {@link DiagramFormat.SVG} file
   *
   * @extends {DiagramFormat.SVG}
   */
  PNG = "png",

  // TODO: add drawio support
}

/**
 * Positional coordinates for a node in inches
 */
export interface INodePosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Base config to specific a unique diagram to be generated.
 * @struct
 */
export interface IDiagramConfigBase {
  /**
   * The output format(s) to generated.
   * @default `DiagramFormat.PNG` - which will through extension also generate `DiagramFormat.SVG` and `DiagramFormat.DOT`
   */
  readonly format?: DiagramFormat | DiagramFormat[];

  /** Graph {@link IGraphFilterPlan Filter Plan}  used to generate a unique diagram */
  readonly filterPlan?: IGraphFilterPlan;

  /** Config for graph theme */
  readonly theme?: GraphThemeConfigProp;

  /** Config for predetermined node positions given their CDK construct id. */
  readonly nodePositions?: { [cdkConstructId: string]: INodePosition };
}

/** Diagram configuration definition
 * @struct
 */
export interface IDiagramConfig extends IDiagramConfigBase {
  /**
   * Name of the diagram. Used as the basename of the generated file(s) which gets the extension appended.
   */
  readonly name: string;

  /**
   * The title of the diagram.
   */
  readonly title: string;

  /**
   * Indicates if default diagram config is applied as defaults to this config.
   *
   * @default false
   */
  readonly ignoreDefaults?: boolean;
}

/**
 * Plugin configuration for diagram plugin.
 * @struct
 */
export interface IPluginConfig {
  /** Default configuration to apply to all diagrams */
  readonly defaults?: IDiagramConfigBase;
  /** List of diagram configurations to generate diagrams */
  readonly diagrams?: IDiagramConfig[];
}

/** Default diagram title */
export const DEFAULT_DIAGRAM_TITLE = "Cloud Diagram";

/** Default diagram name */
export const DEFAULT_DIAGRAM_NAME = "diagram";

/** Default configuration settings */
export const CONFIG_DEFAULTS: IDiagramConfigBase = {
  format: [DiagramFormat.PNG],
  filterPlan: {
    preset: FilterPreset.COMPACT,
  },
};

/** Default diagram config */
export const DEFAULT_DIAGRAM: IDiagramConfig = {
  name: DEFAULT_DIAGRAM_NAME,
  title: DEFAULT_DIAGRAM_TITLE,
};
