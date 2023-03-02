/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { aws_arch } from "@aws-prototyping-sdk/aws-arch";
// @ts-ignore - just used for jsdoc type link, but errors as unused
import type { Graph } from "@aws-prototyping-sdk/cdk-graph";
import cloneDeep = require("lodash.clonedeep"); // eslint-disable-line @typescript-eslint/no-require-imports
import * as Dot from "ts-graphviz";
import { FONT_STYLESHEET, GraphFonts } from "../../fonts";

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

/**
 * Icon definition for graph rendering of resource icons.
 * @internal
 */
export interface IGraphThemeRenderingIconInternal {
  /** Lowest Graph.ResourceNode icon to render */
  readonly resourceIconMin: GraphThemeRenderingIconTarget;
  /** Highest Graph.ResourceNode icon to render */
  readonly resourceIconMax: GraphThemeRenderingIconTarget;
  /** Lowest Graph.CfnResourceNode icon to render */
  readonly cfnResourceIconMin: GraphThemeRenderingIconTarget;
  /** Highest Graph.CfnResourceNode icon to render */
  readonly cfnResourceIconMax: GraphThemeRenderingIconTarget;
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

/**
 * Rendering definition for the graph theme.
 * @internal
 */
export interface IGraphThemeRenderingInternal
  extends IGraphThemeRenderingIconInternal,
    IGraphThemeRenderingOptions {}

const DEFAULT_RENDERING: IGraphThemeRenderingInternal = {
  resourceIconMin: GraphThemeRenderingIconTarget.DATA,
  resourceIconMax: GraphThemeRenderingIconTarget.CATEGORY,
  cfnResourceIconMin: GraphThemeRenderingIconTarget.DATA,
  cfnResourceIconMax: GraphThemeRenderingIconTarget.SERVICE,
} as const;

/** GraphTheme definition */
export interface IGraphTheme {
  readonly rendering: IGraphThemeRenderingInternal;

  /** Styling for {@link Dot.Digraph} */
  readonly graph: Dot.GraphAttributesObject;
  /** Styling for {@link Dot.Subgraph}s */
  readonly subgraph: Dot.SubgraphAttributesObject;
  /** Styling for {@link Dot.Subgraph} **clusters** */
  readonly cluster: Dot.SubgraphAttributesObject;
  /** Default styling for {@link Dot.Node}s */
  readonly node: Dot.NodeAttributesObject;
  /** Default styling for {@link Dot.Edge}s */
  readonly edge: Dot.EdgeAttributesObject;

  // containers
  /** Styling for **cloud** *containers* */
  readonly cloud: Dot.SubgraphAttributesObject;
  /** Styling for {@link Graph.StageNode} diagram entities */
  readonly stage: Dot.SubgraphAttributesObject;
  /** Styling for {@link Graph.StackNode} diagram entities */
  readonly stack: Dot.SubgraphAttributesObject;
  /** Styling for {@link Graph.NestedStackNode} diagram entities */
  readonly nestedStack: Dot.SubgraphAttributesObject;

  // nodes
  /** Default styling for {@link Dot.Node}s that have an **image** */
  readonly imageNode: Dot.NodeAttributesObject;
  /** Styling for {@link Graph.CfnResourceNode} diagram entities */
  readonly cfnResourceNode: Dot.NodeAttributesObject;
  /** Styling for {@link Graph.ResourceNode} diagram entities */
  readonly resourceNode: Dot.NodeAttributesObject;

  // edges
  /** Styling for {@link Graph.Edge} *parent-child* based diagram edges */
  readonly childLink: Dot.EdgeAttributesObject;
  /** Styling for {@link Graph.Reference} based diagram edges */
  readonly referenceLink: Dot.EdgeAttributesObject;
  /** Styling for {@link Graph.Dependency} based diagram edges */
  readonly dependencyLink: Dot.EdgeAttributesObject;

  // from
  /** Reference to the theme definition for this diagram theme - {@link aws_arch.Theme} */
  readonly awsTheme?: aws_arch.Theme;
}

/** GraphThemeConfigAlt is simplified definition of theme to apply */
export interface IGraphThemeConfigAlt {
  readonly theme?: aws_arch.Themes;
  readonly rendering?: IGraphThemeRendering;
}

export type GraphThemeConfigProp = aws_arch.Themes | IGraphThemeConfigAlt;

/** GraphTheme class is the implementation of diagram graph based theme */
export class GraphTheme implements IGraphTheme {
  /** Initializes the theme based on {@link aws_arch.Theme} definition */
  static init(config?: GraphThemeConfigProp): GraphTheme {
    if (config == null || typeof config === "string") {
      this._instance = new GraphTheme(
        generateGraphThemeFromAwsTheme(aws_arch.resolveTheme(config))
      );
    } else if (Object.keys(config).length <= 2) {
      const { theme, rendering } = config as IGraphThemeConfigAlt;

      this._instance = new GraphTheme(
        generateGraphThemeFromAwsTheme(aws_arch.resolveTheme(theme), rendering)
      );
    } else {
      this._instance = new GraphTheme(config as IGraphTheme);
    }

    return this.instance;
  }

  /** @internal */
  private static _instance: GraphTheme;

  /** Get the current singleton instance for the theme being utilized for the diagram */
  static get instance(): GraphTheme {
    if (this._instance == null) {
      throw new Error("Must init GraphTheme before requesting instance");
    }
    return this._instance;
  }

  /** @inheritdoc */
  readonly rendering: IGraphThemeRenderingInternal;

  /** @inheritdoc */
  readonly graph: Dot.GraphAttributesObject;
  /** @inheritdoc */
  readonly subgraph: Dot.SubgraphAttributesObject;
  /** @inheritdoc */
  readonly cluster: Dot.SubgraphAttributesObject;
  /** @inheritdoc */
  readonly node: Dot.NodeAttributesObject;
  /** @inheritdoc */
  readonly edge: Dot.EdgeAttributesObject;
  /** @inheritdoc */
  readonly cloud: Dot.SubgraphAttributesObject;
  /** @inheritdoc */
  readonly stage: Dot.SubgraphAttributesObject;
  /** @inheritdoc */
  readonly stack: Dot.SubgraphAttributesObject;
  /** @inheritdoc */
  readonly nestedStack: Dot.SubgraphAttributesObject;
  /** @inheritdoc */
  readonly imageNode: Dot.NodeAttributesObject;
  /** @inheritdoc */
  readonly cfnResourceNode: Dot.NodeAttributesObject;
  /** @inheritdoc */
  readonly resourceNode: Dot.NodeAttributesObject;
  /** @inheritdoc */
  readonly childLink: Dot.EdgeAttributesObject;
  /** @inheritdoc */
  readonly referenceLink: Dot.EdgeAttributesObject;
  /** @inheritdoc */
  readonly dependencyLink: Dot.EdgeAttributesObject;
  /** @inheritdoc */

  /** @inheritdoc */
  readonly awsTheme?: aws_arch.Theme | undefined;

  /** @internal */
  private constructor(theme: IGraphTheme) {
    this.rendering = theme.rendering;

    this.graph = theme.graph;
    this.subgraph = theme.subgraph;
    this.cluster = theme.cluster;
    this.node = theme.node;
    this.edge = theme.edge;
    this.cloud = theme.cloud;
    this.stage = theme.stage;
    this.stack = theme.stack;
    this.nestedStack = theme.nestedStack;
    this.imageNode = theme.imageNode;
    this.cfnResourceNode = theme.cfnResourceNode;
    this.resourceNode = theme.resourceNode;
    this.childLink = theme.childLink;
    this.referenceLink = theme.referenceLink;
    this.dependencyLink = theme.dependencyLink;

    this.awsTheme = theme.awsTheme;
  }
}

/** Get the base theme */
export function getBaseTheme(rendering?: IGraphThemeRendering): IGraphTheme {
  return cloneDeep({
    rendering: {
      ...DEFAULT_RENDERING,
      ...rendering,
    },
    graph: GRAPH_ATTRIBUTES,
    subgraph: SUBGRAPH_ATTRIBUTES,
    cluster: CLUSTER_ATTRIBUTES,
    node: NODE_ATTRIBUTES,
    edge: EDGE_ATTRIBUTES,
    cloud: CLOUD_ATTRIBUTES,
    stage: STAGE_ATTRIBUTES,
    stack: STACK_ATTRIBUTES,
    nestedStack: NESTED_STACK_ATTRIBUTES,
    imageNode: IMAGE_NODE_ATTRIBUTES,
    cfnResourceNode: CFN_RESOURCE_NODE_ATTRIBUTES,
    resourceNode: RESOURCE_NODE_ATTRIBUTES,
    childLink: CHILD_LINK_ATTRIBUTES,
    referenceLink: REFERENCE_LINK_ATTRIBUTES,
    dependencyLink: DEPENDENCY_LINK_ATTRIBUTES,
  });
}

/** Generate {@link IGraphTheme} from {@link aws_arch.Theme} */
function generateGraphThemeFromAwsTheme(
  awsTheme: aws_arch.Theme,
  rendering?: IGraphThemeRendering
): IGraphTheme {
  const theme = getBaseTheme(rendering);

  Object.assign(theme, {
    awsTheme,
  });

  Object.assign(theme.graph, {
    bgcolor: awsTheme.backgrounds.base,
    fontcolor: awsTheme.text.default as Dot.Color,
  });

  Object.assign(theme.node, {
    fontcolor: awsTheme.text.primary as Dot.Color,
  });
  Object.assign(theme.edge, awsArrowToEdgeAtts(awsTheme.arrows.default));

  // containers
  Object.assign(theme.cloud, awsGroupToSubgraphAtts(awsTheme.groups.cloud));
  Object.assign(
    theme.stage,
    awsGroupToSubgraphAtts(awsTheme.groups.awsAccount, true)
  );
  Object.assign(
    theme.stack,
    awsGroupToSubgraphAtts(awsTheme.groups.genericAlt, true)
  );
  Object.assign(
    theme.nestedStack,
    awsGroupToSubgraphAtts(awsTheme.groups.genericAlt, true)
  );

  // nodes
  Object.assign(theme.cfnResourceNode, {
    color: awsTheme.text.secondary,
    fontcolor: awsTheme.text.secondary as Dot.Color,
  });
  Object.assign(theme.resourceNode, {
    color: awsTheme.text.primary,
    fontcolor: awsTheme.text.primary as Dot.Color,
  });

  Object.assign(theme.childLink, awsArrowToEdgeAtts(awsTheme.arrows.child));
  Object.assign(
    theme.referenceLink,
    awsArrowToEdgeAtts(awsTheme.arrows.reference)
  );
  Object.assign(
    theme.dependencyLink,
    awsArrowToEdgeAtts(awsTheme.arrows.dependency)
  );

  return theme;
}

/** Base graph attributes */
const GRAPH_ATTRIBUTES: Dot.GraphAttributesObject = {
  ...GraphFonts.REGULAR,
  center: true,
  compound: true,
  concentrate: true,
  dpi: 300,
  fontcolor: "#222222",
  fontnames: "ps",
  fontsize: 14,
  forcelabels: true,
  labelloc: "tc",
  nodesep: 0.6,
  pad: "%2,%1",
  rankdir: "TB",
  ranksep: 0.75,
  ratio: "compress",
  remincross: true,
  size: "%1024,%1024!",
  splines: "ortho",
  stylesheet: FONT_STYLESHEET,
};

/** Base subgraph attributes */
const SUBGRAPH_ATTRIBUTES: Dot.SubgraphAttributesObject = {
  ...GraphFonts.LIGHT_ITALIC,
  labelloc: "tc",
  fontsize: 12,
  style: "rounded,solid",
};

/** Base cluster attributes */
const CLUSTER_ATTRIBUTES: Dot.SubgraphAttributesObject = {
  ...GraphFonts.LIGHT,
  labelloc: "tc",
  fontsize: 12,
  style: "rounded,dashed",
};

/** Base cloud container attributes */
const CLOUD_ATTRIBUTES: Dot.SubgraphAttributesObject = {
  ...GraphFonts.BOLD,
  style: "solid",
};

/** Base stage attributes */
const STAGE_ATTRIBUTES: Dot.SubgraphAttributesObject = {
  ...GraphFonts.BOLD_ITALIC,
  style: "dashed",
  margin: 6,
  rank: "same",
};

/** Base stack attributes */
const STACK_ATTRIBUTES: Dot.SubgraphAttributesObject = {
  ...GraphFonts.LIGHT,
  style: "solid,bold,filled",
  fillcolor: "#5A6B861A", // 10%
  margin: 10,
};

/** Base nested stack attributes */
const NESTED_STACK_ATTRIBUTES: Dot.SubgraphAttributesObject = {
  ...GraphFonts.LIGHT_ITALIC,
  style: "solid,filled",
  fillcolor: "#5A6B861A", // 10%
  margin: 6,
};

/** Base node attributes */
const NODE_ATTRIBUTES: Dot.NodeAttributesObject = {
  ...GraphFonts.REGULAR,
  shape: "box",
  style: "solid",
  fixedsize: false,
  width: 0.25,
  height: 0.25,
  labelloc: "c",
  imagescale: true,
  fontsize: 11,
  penwidth: 0.25,
};

/** Base image based node attributes */
const IMAGE_NODE_ATTRIBUTES: Dot.NodeAttributesObject = {
  shape: "box",
  style: "solid,rounded",
  fixedsize: true,
  width: 1,
  height: 1,
  labelloc: "b",
  imagescale: true,
  imagepos: "tc",
  penwidth: 0,
  fillcolor: "transparent",
};

/** Base cfn resource node attributes */
const CFN_RESOURCE_NODE_ATTRIBUTES: Dot.NodeAttributesObject = {
  width: 1,
  height: 1,
  fixedsize: true,
  style: "solid,rounded",
  color: "#999999",
  fontcolor: "#999999",
};

/** Base resource node attributes */
const RESOURCE_NODE_ATTRIBUTES: Dot.NodeAttributesObject = {
  width: 1,
  height: 1,
  fixedsize: true,
  color: "#666666",
  fontcolor: "#666666",
};

/** Base edge attributes */
const EDGE_ATTRIBUTES: Dot.EdgeAttributesObject = {
  ...GraphFonts.LIGHT_ITALIC,
  dir: "both",
  color: "#545B64",
  penwidth: 0.75,
  arrowhead: "dot",
  arrowtail: "dot",
  arrowsize: 0.5,
  fontsize: 9,
  style: "solid",
};

/** Base child link attributes */
const CHILD_LINK_ATTRIBUTES: Dot.EdgeAttributesObject = {
  penwidth: 1,
  arrowhead: "none",
  arrowtail: "normal",
  arrowsize: 1,
  style: "solid",
};

/** Base reference link attributes */
const REFERENCE_LINK_ATTRIBUTES: Dot.EdgeAttributesObject = {
  penwidth: 1,
  arrowhead: "none",
  arrowtail: "normal",
  arrowsize: 0.75,
  style: "solid",
};

/** Base dependency link attributes */
const DEPENDENCY_LINK_ATTRIBUTES: Dot.EdgeAttributesObject = {
  penwidth: 0.75,
  arrowhead: "dot",
  arrowtail: "odot",
  arrowsize: 0.75,
  style: "dotted",
};

/** Convert {@link aws_arch.GroupFormat} to {@link Dot.SubgraphAttributesObject} */
function awsGroupToSubgraphAtts(
  group: aws_arch.GroupFormat,
  ignoreStyle: boolean = false
): Dot.SubgraphAttributesObject {
  const attributes: Dot.SubgraphAttributesObject = {};

  if (!ignoreStyle) {
    if (group.borderStyle === "none") {
      attributes.style = "solid";
      attributes.penwidth = 0;
    } else {
      attributes.style = group.borderStyle;
    }
  }

  attributes.color = group.color || "transparent";
  attributes.bgcolor = group.bgcolor || "transparent";
  attributes.fillcolor = group.bgcolor || "transparent";
  attributes.pencolor = (group.borderColor || "transparent") as Dot.Color;
  if (group.color && group.color !== "transparent") {
    attributes.fontcolor = group.color as Dot.Color;
  }

  return attributes;
}

/** Convert {@link aws_arch.ArrowFormat} to {@link Dot.EdgeAttributesObject} */
function awsArrowToEdgeAtts(
  arrow: aws_arch.ArrowFormat
): Dot.EdgeAttributesObject {
  return {
    color: arrow.color as Dot.Color,
    fontcolor: arrow.color as Dot.Color,
    arrowtail: arrow.tail,
    arrowhead: arrow.head,
    penwidth: arrow.width,
    style: arrow.style as Dot.Style,
  };
}
