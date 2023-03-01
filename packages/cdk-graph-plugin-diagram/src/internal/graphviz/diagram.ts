/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsArchitecture } from "@aws-prototyping-sdk/aws-arch";
import {
  EdgeTypeEnum,
  FilterPreset,
  FlagEnum,
  Graph,
  NodeTypeEnum,
  UUID,
} from "@aws-prototyping-sdk/cdk-graph";
import uniqBy = require("lodash.uniqby"); // eslint-disable-line @typescript-eslint/no-require-imports
import * as Dot from "ts-graphviz";
import * as Diagram from "./entities";
import { ChildLink, ImageNode } from "./entities";
import { GraphTheme, GraphThemeConfigProp } from "./theme";

/**
 * Union of entities support by diagram
 * @internal
 */
type TDiagramEntity = Diagram.Subgraph | Diagram.Node | Diagram.Edge;

/** Options for diagrams */
export interface DiagramOptions {
  readonly title: string;
  readonly preset?: FilterPreset;
  readonly theme?: GraphThemeConfigProp;
}

/**
 * EdgeResolver class resolves edges within a diagram for rendering
 * @internal
 */
class EdgeResolver {
  /** @internal */
  private readonly _edges: Map<string, Diagram.BaseEdge[]> = new Map();

  /** Adds diagram edge to the resolver to be resolved */
  trackEdge(edge: Diagram.BaseEdge): void {
    let fromId: string;
    let toId: string;
    if (edge instanceof Diagram.Edge) {
      fromId = edge.graphEdge.source.uuid;
      toId = edge.graphEdge.target.uuid;
    } else {
      fromId = edge.from.graphNode.uuid;
      toId = edge.to.graphNode.uuid;
    }
    const key = fromId < toId ? `${fromId}:${toId}` : `${toId}:${fromId}`;
    const edgeSet = this._edges.get(key) || [];
    this._edges.set(key, edgeSet.concat([edge]));
  }

  /** Resolve all edges based on diagram options */
  resolveEdges(options: DiagramOptions): Dot.Edge[] {
    const compact = options.preset === FilterPreset.COMPACT;

    const resolvedEdges: Dot.Edge[] = [];
    for (let edges of this._edges.values()) {
      if (compact) {
        edges = edges.filter((edge) => !edge.isVerbose);
      }

      if (edges.length === 0) {
        continue;
      }

      edges.sort((a, b) => {
        const _a = getEdgeRank(a);
        const _b = getEdgeRank(b);
        if (_a === _b) return 0;
        if (_a < _b) return -1;
        return 1;
      });

      edges = uniqBy(edges, getEdgeRank);

      // only return highest ranked edge unless verbose
      if (compact) {
        resolvedEdges.push(edges[0]);
        continue;
      }

      for (const _edge1 of edges) {
        for (const _edge2 of edges) {
          if (_edge1 === _edge2) continue;

          const _id1 = _edge1.attributes.get("id")!;
          const _id2 = _edge2.attributes.get("id")!;

          let _sameHead1 = _edge1.attributes.get("samehead") as string;
          _edge1.attributes.set(
            "samehead",
            !_sameHead1 ? _id2 : `${_sameHead1},${_id2}`
          );
          let _sameTail1 = _edge1.attributes.get("sametail") as string;
          _edge1.attributes.set(
            "sametail",
            !_sameTail1 ? _id2 : `${_sameTail1},${_id2}`
          );

          let _sameHead2 = _edge2.attributes.get("samehead") as string;
          _edge2.attributes.set(
            "samehead",
            !_sameHead2 ? _id1 : `${_sameHead2},${_id1}`
          );
          let _sameTail2 = _edge2.attributes.get("sametail") as string;
          _edge2.attributes.set(
            "sametail",
            !_sameTail2 ? _id1 : `${_sameTail2},${_id1}`
          );
        }
      }

      resolvedEdges.push(...edges);
    }

    return resolvedEdges;
  }
}

/**
 * Build a {@link Diagram.Diagram Diagram} for a given {@link Graph.Store} based on {@link DiagramOptions Options}
 * @internal
 */
export function buildDiagram(
  store: Graph.Store,
  options: DiagramOptions
): Diagram.Diagram {
  const { title } = options;

  const edgeResolve = new EdgeResolver();

  GraphTheme.init(options.theme);

  const entities: Map<UUID, TDiagramEntity> = new Map();
  const diagram = new Diagram.Diagram(title, AwsArchitecture.assetDirectory);

  function visit(
    gNode: Graph.Node,
    parent: Diagram.Subgraph | Diagram.Diagram
  ) {
    if (gNode.isDestroyed) return;

    let entity: Diagram.Container | Diagram.Node;

    switch (gNode.nodeType) {
      case NodeTypeEnum.RESOURCE: {
        entity = new Diagram.ResourceNode(gNode as Graph.ResourceNode);
        break;
      }
      case NodeTypeEnum.CFN_RESOURCE: {
        entity = new Diagram.CfnResourceNode(gNode as Graph.CfnResourceNode);
        break;
      }
      case NodeTypeEnum.NESTED_STACK: {
        entity = new Diagram.NestedStackCluster(gNode as Graph.NestedStackNode);
        break;
      }
      case NodeTypeEnum.STACK: {
        entity = new Diagram.StackCluster(gNode as Graph.StackNode);
        break;
      }
      default: {
        if (gNode.isLeaf) {
          entity = new Diagram.Node(gNode);
        } else {
          entity = new Diagram.Cluster(gNode);
          gNode.addFlag(FlagEnum.CLUSTER);
        }
        break;
      }
    }

    if (entity instanceof ImageNode && entity.image) {
      diagram.trackImage(entity.image);
    }

    if (parent instanceof Diagram.Container && parent.linkChildren) {
      edgeResolve.trackEdge(new ChildLink(parent, entity));
    }

    if (gNode.isLeaf) {
      entities.set(gNode.uuid, entity);
      parent.addNode(entity as Diagram.Node);
    } else {
      if (entity instanceof Diagram.Node) {
        entity = asContainer(entity);
      }

      parent.addSubgraph(entity as Diagram.Container);

      entities.set(gNode.uuid, entity);

      gNode.children.forEach((child) =>
        visit(child, entity as Diagram.Container)
      );
    }
  }

  if (store.stages.length) {
    // traverse all stages
    store.stages.forEach((gStage) => {
      const dStage = new Diagram.StageCluster(gStage);
      diagram.addSubgraph(dStage);
      entities.set(gStage.uuid, dStage);
      gStage.children.forEach((child) => visit(child, dStage));
    });
  } else if (store.rootStacks.length) {
    // traverse all root stack
    store.rootStacks.forEach((gStack) => {
      const dStack = new Diagram.StackCluster(gStack);
      diagram.addSubgraph(dStack);
      entities.set(gStack.uuid, dStack);
      gStack.children.forEach((child) => visit(child, dStack));
    });
  } else {
    store.root.children.forEach((gChild) => {
      if (gChild.isGraphContainer) {
        gChild.children.forEach((_gChild) => {
          visit(_gChild, diagram);
        });
      } else {
        visit(gChild, diagram);
      }
    });
  }

  // apply all edges
  store.edges.forEach((gEdge) => {
    if (gEdge.isDestroyed) return;

    const dSource = entities.get(gEdge.source.uuid) as
      | Diagram.Container
      | Diagram.Node;
    const dTarget = entities.get(gEdge.target.uuid) as
      | Diagram.Container
      | Diagram.Node;

    if (!dSource || !dTarget) {
      console.warn(
        "Diagram.Edge unresolved source and/or target:",
        `source(${gEdge.source} => ${dSource})`,
        `target(${gEdge.target} => ${dTarget})`
      );
      return;
    }

    let edge: Diagram.Edge | undefined = undefined;

    switch (gEdge.edgeType) {
      case EdgeTypeEnum.REFERENCE: {
        edge = new Diagram.ReferenceLink(gEdge, dSource, dTarget);
        break;
      }
      case EdgeTypeEnum.DEPENDENCY: {
        edge = new Diagram.DependencyLink(gEdge, dSource, dTarget);
        break;
      }
    }

    if (edge) {
      entities.set(gEdge.uuid, edge);
      edgeResolve.trackEdge(edge);
    }
  });

  edgeResolve.resolveEdges(options).forEach((edge) => {
    diagram.addEdge(edge);
  });

  return diagram;
}

/**
 * Wrap a {@link Diagram.Node} with {@link Diagram.Container} to support adding child {@link Diagram.Node}s
 * @internal
 */
function asContainer(node: Diagram.Node): Diagram.Container {
  const container = new Diagram.Container(node.graphNode);
  container.addNode(node);
  return container;
}

/**
 * Get the rank score of an {@link Diagram.BaseEdge Edge} used to sort and prioritize edges
 * @internal
 */
function getEdgeRank(edge: Diagram.BaseEdge): number {
  if (edge instanceof Diagram.ChildLink) {
    return 0;
  }
  if (edge instanceof Diagram.ReferenceLink) {
    return 1;
  }
  if (edge instanceof Diagram.DependencyLink) {
    return 2;
  }
  return 3;
}
