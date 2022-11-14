/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Graph } from "@aws-prototyping-sdk/cdk-graph";
import * as Dot from "ts-graphviz";
import { EdgeAttributesObject } from "ts-graphviz";
import { GraphTheme } from "../theme";
import { Node } from "./nodes";
import { Container } from "./subgraphs";

/**
 * Union of targets supported by edges
 * @internal
 */
type EdgeTarget = Node | Container;

/**
 * BaseEdge class is the base class for defining a {@link Dot.Edge}.
 * @internal
 */
export abstract class BaseEdge extends Dot.Edge {
  /** Tail edge target */
  public readonly from: EdgeTarget;

  /** Head edge target */
  public readonly to: EdgeTarget;

  /** Indicates if edge is [compound](https://graphviz.org/docs/attrs/compound/), meaning it is between a cluster */
  readonly isCompound: boolean;
  /**
   * Indicates if [compound](https://graphviz.org/docs/attrs/compound/) edge targets are synthetically added.
   *
   * For *compound* edges, if the cluster (container) does not have any children a *synthetic* child is
   * added to support edge targeting.
   */
  readonly isSynthetic: boolean;

  /** @internal */
  protected _extraneous: boolean;

  /** Indicates if edge is considered **extraneous** */
  get isExtraneous(): boolean {
    return this.isSynthetic;
  }

  /** Indicates if edge is considered **verbose** */
  get isVerbose(): boolean {
    return this.isExtraneous || this.isClosedLoop;
  }

  /** Indicates if edge is a *closed loop*, meaning its *leaf* and *head* are the same entity */
  get isClosedLoop(): boolean {
    const [from, to] = this.targets as Dot.NodeModel[];
    if (from.id === to.id) return true;
    if (from.id === this.attributes.get("lhead")) return true;
    if (to.id === this.attributes.get("ltail")) return true;
    return false;
  }

  /** @internal */
  constructor(
    from: EdgeTarget,
    to: EdgeTarget // TODO: support edge chain (need to handle subgraph case) // ...rest: EdgeTarget[]
  ) {
    const _attributes: EdgeAttributesObject = {};
    let isCompound = false;
    let isSynthetic = false;

    // [compound](https://graphviz.org/docs/attrs/compound/) support - referencing container rather than node
    let _from: Dot.EdgeTargetLike;
    if (from instanceof Container) {
      isCompound = true;
      _from = from.nodes[0];
      if (_from == null) {
        isSynthetic = true;
        _from = {
          id: `synthetic_${from.id!}`,
          style: "none",
          shape: "none",
          label: "",
        } as Dot.NodeRef;
      }
      // https://graphviz.org/docs/attrs/ltail/
      _attributes.ltail = from.id!;
    } else {
      _from = from;
    }

    let _to: Dot.EdgeTargetLike;
    if (to instanceof Container) {
      _to = to.nodes[0];
      isCompound = true;
      if (_to == null) {
        isSynthetic = true;
        _to = {
          id: `synthetic_${to.id!}`,
          style: "none",
          shape: "none",
          label: "",
        } as Dot.NodeRef;
      }
      // https://graphviz.org/docs/attrs/lhead/
      _attributes.lhead = to.id!;
    } else {
      _to = to;
    }

    super([_from, _to], _attributes);

    this.from = from;
    this.to = to;

    this._extraneous = false;
    this.isCompound = isCompound;
    this.isSynthetic = isSynthetic;
  }
}

/**
 * Edge class is the base class for {@link Graph.Edge} based {@link Dot.Edge} entities
 * @internal
 */
export class Edge extends BaseEdge {
  /** Reference to the {@link Graph.Edge} that this diagram edge is based on */
  readonly graphEdge: Graph.Edge;

  /** @internal */
  constructor(
    edge: Graph.Edge,
    from: EdgeTarget,
    to: EdgeTarget
    // TODO: support edge chain (need to handle subgraph case)
    // Need to have specific use case before implementing this, but Dot.Edge supports chaining
    // ...rest: EdgeTarget[]
  ) {
    super(from, to);

    this.attributes.set("id", edge.uuid);

    this.graphEdge = edge;

    this._extraneous = edge.isExtraneous;
  }
}

/**
 * Link class defines a {@link Graph.Edge} defined by a {@link Graph.Node}
 * @internal
 */
export class Link extends Edge {
  /** @internal */
  constructor(edge: Graph.Edge, from: EdgeTarget, to: EdgeTarget) {
    super(edge, from, to);
  }
}

/**
 * ChildLink class defines a {@link Dot.Edge} for a {@link Graph.Edge} that describes a parent-child {@link Graph.Node} relationship
 * @internal
 */
export class ChildLink extends BaseEdge {
  /** @internal */
  constructor(from: EdgeTarget, to: EdgeTarget) {
    super(from, to);

    this.attributes.apply(GraphTheme.instance.childLink);
  }
}

/**
 * ReferenceLink class defines a {@link Dot.Edge} for a {@link Graph.Reference} edge
 * @internal
 */
export class ReferenceLink extends Link {
  /** @internal */
  constructor(edge: Graph.Edge, from: EdgeTarget, to: EdgeTarget) {
    super(edge, from, to);

    this.attributes.apply(GraphTheme.instance.referenceLink);
  }
}

/**
 * DependencyLink class defines a {@link Dot.Edge} for a {@link Graph.Dependency} edge
 * @internal
 */
export class DependencyLink extends Link {
  /** @internal */
  constructor(edge: Graph.Edge, from: EdgeTarget, to: EdgeTarget) {
    super(edge, from, to);

    this.attributes.apply(GraphTheme.instance.dependencyLink);
  }
}
