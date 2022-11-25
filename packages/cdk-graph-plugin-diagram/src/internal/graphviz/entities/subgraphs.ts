/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Graph } from "@aws-prototyping-sdk/cdk-graph";
import * as Dot from "ts-graphviz";
import { GraphTheme } from "../theme";

/**
 * Subgraph class is the base diagram {@link Dot.Subgraph} entity, which is the base container
 * for grouping {@link Dot.Node} entities.
 * @internal
 */
export class Subgraph extends Dot.Subgraph {
  /** @internal */
  protected _linkChildren: boolean = true;

  get linkChildren(): boolean {
    return this._linkChildren;
  }

  constructor(id: string, label: string) {
    super(id);

    this.apply(GraphTheme.instance.subgraph);

    this.set("label", label);
  }
}

/**
 * Container class is the base for styled diagram {@link Dot.Subgraph} entities,
 * which defines a group of {@link Dot.Node} entities
 * @internal
 */
export class Container extends Subgraph {
  readonly graphNode: Graph.Node;

  constructor(node: Graph.Node, prefix: string = "container") {
    super(`${prefix}_${node.uuid}`, node.id);

    this.set("style", "rounded,dashed");

    this.graphNode = node;
  }
}

/**
 * Cluster class is the base for styled diagram **cluster** {@link Dot.Subgraph} entities.
 * @internal
 */
export class Cluster extends Container {
  /** @internal */
  constructor(node: Graph.Node, subprefix?: string) {
    super(node, "cluster" + (subprefix ? `_${subprefix}` : ""));

    this.apply(GraphTheme.instance.cluster);

    this._linkChildren = false;
  }
}

/**
 * StageCluster class defines a {@link Dot.Subgraph} based on a {@link Graph.StageNode}
 * @internal
 */
export class StageCluster extends Cluster {
  /** @internal */
  constructor(node: Graph.StageNode, subprefix: string = "stage") {
    super(node, subprefix);

    this.apply(GraphTheme.instance.stage);
  }
}

/**
 * StackCluster class defines a {@link Dot.Subgraph} based on a {@link Graph.StackNode}
 * @internal
 */
export class StackCluster extends Cluster {
  /** @internal */
  constructor(node: Graph.StackNode, subprefix: string = "stack") {
    super(node, subprefix);

    this.apply(GraphTheme.instance.stack);
  }
}

/**
 * NestedStackCluster class defines a {@link Dot.Subgraph} based on a {@link Graph.NestedStackNode}
 * @internal
 */
export class NestedStackCluster extends StackCluster {
  /** @internal */
  constructor(node: Graph.NestedStackNode) {
    super(node, "nstack");

    this.apply(GraphTheme.instance.nestedStack);
  }
}
