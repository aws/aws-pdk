/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ConstructOrder } from "constructs";
import memoize = require("lodash.memoize"); // eslint-disable-line @typescript-eslint/no-require-imports
import { FilterStrategy, IGraphFilter, IGraphStoreFilter } from "./types";
import { FlagEnum, Graph, NodeTypeEnum } from "../core";

/**
 * Verify that store is filterable, meaning it allows destructive mutations.
 * @throws Error if store is not filterable
 */
export function verifyFilterable(store: Graph.Store): void {
  if (!store.allowDestructiveMutations) {
    throw new Error(
      "Store must allow destructive mutations to perform filtering; clone the store before applying filters using `store.clone(true)` operation and passing the cloned store to filtering operation."
    );
  }
}

export namespace Filters {
  /**
   * Prune **extraneous** nodes and edges
   * @throws Error if store is not filterable
   * @destructive
   */
  export function pruneExtraneous(): IGraphStoreFilter {
    return (store) => {
      verifyFilterable(store);

      const extraneousNodes = store.root.findAll({
        order: ConstructOrder.POSTORDER,
        predicate: (node) => node.isExtraneous,
      });
      // collapse all extraneous nodes to nearest non-extraneous parent, or prune the node
      for (const extraneousNode of extraneousNodes) {
        const nonExtraneousAncestor = extraneousNode.findAncestor(
          (node) => !node.isExtraneous
        );
        if (nonExtraneousAncestor && !nonExtraneousAncestor.isGraphContainer) {
          extraneousNode.mutateCollapseTo(nonExtraneousAncestor);
        } else {
          extraneousNode.mutateDestroy();
        }
      }

      store.edges.forEach((edge) => {
        if (edge.isExtraneous) {
          edge.mutateDestroy();
        }
      });
    };
  }

  /**
   * Collapses extraneous nodes to parent and cdk created nodes on themselves,
   * and prunes extraneous edges.
   *
   * This most closely represents the developers code for the current application
   * and reduces the noise one expects.
   *
   * @throws Error if store is not filterable
   * @destructive
   */
  export function compact(): IGraphStoreFilter {
    return (store) => {
      verifyFilterable(store);
      pruneExtraneous()(store);

      const cdkOwnedContainers = store.root.findAll({
        order: ConstructOrder.POSTORDER,
        predicate: (node) =>
          node.hasFlag(FlagEnum.CDK_OWNED) &&
          !node.parent?.hasFlag(FlagEnum.CDK_OWNED),
      });
      // collapse all cdk owned containers
      // NB: collapses the graph more closely mirror what developer writes, not what is auto created by cdk
      for (const cdkOwnedContainer of cdkOwnedContainers) {
        cdkOwnedContainer.mutateCollapse();
      }

      const cdkResources = store.root.findAll({
        order: ConstructOrder.POSTORDER,
        predicate: (node) => Graph.ResourceNode.isResourceNode(node),
      }) as Graph.ResourceNode[];
      // collapse all cfnResource wrapped by cdk resource
      for (const cdkResource of cdkResources) {
        if (cdkResource.isResourceWrapper) {
          cdkResource.mutateCollapse();
        } else if (cdkResource.cfnResource) {
          cdkResource.cfnResource.mutateCollapseToParent();
        }
      }
    };
  }

  function _filterNodeType(
    values: (string | RegExp)[],
    exclude: boolean
  ): IGraphStoreFilter {
    const isMatch = memoize((input: string) => {
      if (input == null) {
        return false;
      }

      return (
        values.find((_value) => {
          if (typeof _value === "string") {
            return input === _value;
          }
          return _value.test(input);
        }) != null
      );
    });

    return (store) => {
      for (const node of store.root.findAll({
        order: ConstructOrder.POSTORDER,
      })) {
        if (isMatch(node.nodeType) === exclude) {
          if (node.isLeaf) {
            node.mutateCollapseToParent();
          } else {
            node.mutateUncluster();
          }
        }
      }
    };
  }

  /**
   * Prune all {@link Graph.Node}s *except those matching* specified list.
   *
   * This filter targets all nodes (except root) - {@link IGraphFilter.allNodes}
   * @throws Error if store is not filterable
   * @destructive
   */
  export function includeNodeType(
    nodeTypes: (string | RegExp)[]
  ): IGraphStoreFilter {
    return _filterNodeType(nodeTypes, false);
  }

  /**
   * Prune all {@link Graph.Node}s *matching* specified list.
   *
   * This filter targets all nodes (except root) - {@link IGraphFilter.allNodes}
   * @throws Error if store is not filterable
   * @destructive
   */
  export function excludeNodeType(
    nodeTypes: (string | RegExp)[]
  ): IGraphStoreFilter {
    return _filterNodeType(nodeTypes, true);
  }

  function _filterCfnType(
    values: (string | RegExp)[],
    exclude: boolean
  ): IGraphFilter {
    const isMatch = memoize((input: string) => {
      if (input == null) {
        return false;
      }

      return (
        values.find((_value) => {
          if (typeof _value === "string") {
            return input === _value;
          }
          return _value.test(input);
        }) != null
      );
    });

    return {
      strategy: FilterStrategy.PRUNE,
      node: (node) => {
        // Preserve container structure (stages, stacks, etc.)
        if (node.isCluster || node.isGraphContainer) return true;
        if (
          Graph.CfnResourceNode.isCfnResourceNode(node) ||
          Graph.ResourceNode.isResourceNode(node)
        ) {
          const match = !!node.cfnType && isMatch(node.cfnType);
          return (match && !exclude) || (!match && exclude);
        }
        // Preserve non *Resource nodes
        return true;
      },
    };
  }

  /**
   * Prune all {@link Graph.ResourceNode} and {@link Graph.CfnResourceNode} nodes
   * *except those matching* specified list of CloudFormation types.
   * @throws Error if store is not filterable
   * @destructive
   */
  export function includeCfnType(cfnTypes: (string | RegExp)[]): IGraphFilter {
    return _filterCfnType(cfnTypes, false);
  }

  /**
   * Prune all {@link Graph.ResourceNode} and {@link Graph.CfnResourceNode} nodes
   * *matching* specified list of CloudFormation types.
   * @throws Error if store is not filterable
   * @destructive
   */
  export function excludeCfnType(cfnTypes: (string | RegExp)[]): IGraphFilter {
    return _filterCfnType(cfnTypes, true);
  }

  /**
   * Remove clusters by hoisting their children to the parent of the cluster
   * and collapsing the cluster itself to its parent.
   * @param clusterTypes
   * @throws Error if store is not filterable
   * @see {@link Graph.Node.mutateUncluster}
   * @destructive
   */
  export function uncluster(clusterTypes?: NodeTypeEnum[]): IGraphStoreFilter {
    // Use set for constant lookup
    const clusterTypesSet = new Set<NodeTypeEnum>(clusterTypes);

    return (store): void => {
      verifyFilterable(store);

      const clusters = store.root.findAll({
        predicate: (node) => {
          if (node.isGraphContainer) return false;
          if (clusterTypesSet.size === 0) return node.isCluster;
          return clusterTypesSet.has(node.nodeType);
        },
      });

      for (const cluster of clusters) {
        cluster.mutateUncluster();
      }
    };
  }
}
