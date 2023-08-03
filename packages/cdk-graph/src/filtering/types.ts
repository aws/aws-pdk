/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ConstructOrder } from "constructs";
import { Graph } from "../core";

/** Filter presets */
export enum FilterPreset {
  /**
   * Collapses extraneous nodes to parent and cdk created nodes on themselves,
   * and prunes extraneous edges.
   *
   * This most closely represents the developers code for the current application
   * and reduces the noise one expects.
   */
  COMPACT = "compact",
  /**
   * Collapses extraneous nodes to parent and prunes extraneous edges.
   */
  NON_EXTRANEOUS = "non-extraneous",
  /**
   * No filtering is performed which will output **verbose** graph.
   */
  NONE = "none",
}

/**
 * Filter strategy to apply to filter matches.
 */
export enum FilterStrategy {
  /** Remove filtered entity and all its edges */
  PRUNE = "prune",
  /** Collapse all child entities of filtered entity into filtered entity; and hoist all edges. */
  COLLAPSE = "collapse",
  /** Collapse all filtered entities into their parent entity; and hoist its edges to parent. */
  COLLAPSE_TO_PARENT = "collapse_to_parent",
}

/**
 * Graph filter.
 */
export interface IGraphFilter {
  /**
   * Indicates that matches will be filtered, as opposed to non-matches.
   *
   * The default follows common [Javascript Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
   * precedence of preserving matches during filtering, while pruning non-matches.
   *
   * @default false - Preserve matches, and filter out non-matches.
   */
  readonly inverse?: boolean;
  /**
   * Filter strategy to apply to matching nodes.
   *
   * Edges do not have a strategy, they are always pruned.
   *
   * @default {FilterStrategy.PRUNE}
   */
  readonly strategy?: FilterStrategy;
  /** Predicate to match nodes */
  readonly node?: Graph.INodePredicate;
  /** Predicate to match edges. Edges are evaluated after nodes are filtered. */
  readonly edge?: Graph.IEdgePredicate;

  /**
   * Indicates that all nodes will be filtered, rather than just Resource and CfnResource nodes.
   *
   * By enabling this, all Stages, Stacks, and structural construct boundaries will be filtered as well.
   * In general, most users intent is to operate against resources and desire to preserve structural groupings,
   * which is common in most Cfn/Cdk based filtering where inputs are "include" lists.
   *
   * Defaults to value of containing {@link IGraphFilterPlan.allNodes}
   */
  readonly allNodes?: boolean;
}

/**
 * Determines focus node of filter plan.
 */
export interface IFilterFocusCallback {
  (store: Graph.Store): Graph.Node;
}

/**
 * Store filter callback interface used to perform filtering operations
 * directly against the store, as opposed to using {@link IGraphFilter}
 * definitions.
 */
export interface IGraphStoreFilter {
  (store: Graph.Store): void;
}

/**
 * @struct
 */
export interface IGraphFilterPlanFocusConfig {
  /** The node or resolver to determine the node to focus on. */
  readonly node: IFilterFocusCallback | Graph.Node;
  /**
   * Indicates if ancestral containers are preserved (eg: Stages, Stack)
   *
   * If `false`, the "focused node" will be hoisted to the graph root and all ancestors will be pruned.
   * If `true`, the "focused" will be left in-place, while all siblings and non-scope ancestors will be pruned.
   *
   * @default true
   */
  readonly noHoist?: boolean;
}

/**
 * Graph filter plan
 */
export interface IGraphFilterPlan {
  /**
   * Optional preset filter to apply before other filters.
   */
  readonly preset?: FilterPreset;

  /**
   * Ordered list of {@link IGraphFilter} and {@link IGraphStoreFilter} filters to
   * apply to the store.
   *
   * - Filters are applied *after* the preset filtering is applied if present.
   * - Filters are applied sequentially against all nodes, as opposed to IAspect.visitor pattern
   * which are sequentially applied per node.
   */
  readonly filters?: (IGraphFilter | IGraphStoreFilter)[];

  /**
   * Config to focus the graph on specific node.
   */
  readonly focus?:
    | IFilterFocusCallback
    | Graph.Node
    | IGraphFilterPlanFocusConfig;

  /**
   * Indicates that all nodes will be filtered, rather than just Resource and CfnResource nodes.
   *
   * By enabling this, all Stages, Stacks, and structural construct boundaries will be filtered as well.
   * In general, most users intent is to operate against resources and desire to preserve structural groupings,
   * which is common in most Cfn/Cdk based filtering where inputs are "include" lists.
   *
   * @default false By default only Resource and CfnResource nodes are filtered.
   */
  readonly allNodes?: boolean;

  /**
   * The order to visit nodes and edges during filtering.
   *
   * @default {ConstructOrder.PREORDER}
   */
  readonly order?: ConstructOrder;
}
