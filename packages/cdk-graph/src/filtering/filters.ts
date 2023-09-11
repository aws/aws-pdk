/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ConstructOrder } from "constructs";
import memoize = require("lodash.memoize"); // eslint-disable-line @typescript-eslint/no-require-imports
import { FilterStrategy, IGraphFilter, IGraphStoreFilter } from "./types";
import { findReferencesOfSubGraph } from "./utils";
import { FlagEnum, Graph, NodeTypeEnum } from "../core";

/**
 * Filter value to use.
 */
export interface FilterValue {
  /**
   * String representation of a regex
   */
  readonly regex?: string;

  /**
   * Raw value
   */
  readonly value?: string;
}

export class Filters {
  /**
   * Verify that store is filterable, meaning it allows destructive mutations.
   * @throws Error if store is not filterable
   */
  public static verifyFilterable(store: Graph.Store): void {
    if (!store.allowDestructiveMutations) {
      throw new Error(
        "Store must allow destructive mutations to perform filtering; clone the store before applying filters using `store.clone(true)` operation and passing the cloned store to filtering operation."
      );
    }
  }

  /**
   * Prune **extraneous** nodes and edges
   * @throws Error if store is not filterable
   * @destructive
   */
  public static pruneExtraneous(): IGraphStoreFilter {
    return {
      filter: (store) => {
        Filters.verifyFilterable(store);

        const extraneousNodes = store.root.findAll({
          order: ConstructOrder.POSTORDER,
          predicate: { filter: (node) => node.isExtraneous },
        });
        // collapse all extraneous nodes to nearest non-extraneous parent, or prune the node
        for (const extraneousNode of extraneousNodes) {
          const nonExtraneousAncestor = extraneousNode.findAncestor({
            filter: (node) => !node.isExtraneous,
          });
          if (
            nonExtraneousAncestor &&
            !nonExtraneousAncestor.isGraphContainer
          ) {
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
      },
    };
  }

  /**
   * Collapses all Cdk Owned containers, which more closely mirrors the application code
   * by removing resources that are automatically created by cdk.
   */
  public static collapseCdkOwnedResources(): IGraphStoreFilter {
    return {
      filter: (store) => {
        store.root
          .findAll({
            order: ConstructOrder.POSTORDER,
            predicate: {
              filter: (node) =>
                Graph.ResourceNode.isResourceNode(node) && node.isCdkOwned,
            },
          })
          .forEach((node) => {
            if (node.isDestroyed) return;
            node.mutateCollapse();
          });
      },
    };
  }

  /**
   * Collapses all Cdk Resource wrappers that wrap directly wrap a CfnResource.
   * Example, s3.Bucket wraps s3.CfnBucket.
   */
  public static collapseCdkWrappers(): IGraphStoreFilter {
    return {
      filter: (store) => {
        const cdkResources = store.root.findAll({
          order: ConstructOrder.POSTORDER,
          predicate: {
            filter: (node) =>
              Graph.ResourceNode.isResourceNode(node) && !node.isLeaf,
          },
        }) as Graph.ResourceNode[];
        // collapse all cfnResource wrapped by cdk resource
        for (const cdkResource of cdkResources) {
          if (cdkResource.isWrapper) {
            cdkResource.mutateCollapse();
          }
        }
      },
    };
  }

  /**
   * Collapses Custom Resource nodes to a single node.
   */
  public static collapseCustomResources(): IGraphStoreFilter {
    return {
      filter: (store) => {
        store.root
          .findAll({
            predicate: {
              filter: (node) => {
                return node.hasFlag(FlagEnum.CUSTOM_RESOURCE);
              },
            },
          })
          .forEach((customResource) => {
            if (customResource.isDestroyed) return;

            customResource.mutateCollapse();

            // const REF_FQN = /^aws-cdk-lib\.aws-(iam|lambda)/

            if (
              !customResource.hasFlag(FlagEnum.AWS_CUSTOM_RESOURCE) &&
              !customResource.parent?.hasFlag(FlagEnum.AWS_CUSTOM_RESOURCE)
            ) {
              let crId = customResource.id;
              if (crId !== "Provider" && crId.endsWith("Provider")) {
                crId = crId.replace(/Provider$/, "");
              }
              // Try to find resources that are utilized only for the custom resource
              findReferencesOfSubGraph(customResource, 3, {
                filter: (node) => {
                  return node.id.includes(crId);
                  // return false && /^aws-cdk-lib\.(aws_)?(iam|lambda)/.test(node.constructInfoFqn || "")
                },
              }).forEach((_ref) => _ref.mutateMove(customResource));

              customResource.mutateCollapse();
            }
          });
      },
    };
  }

  /**
   * Prune Custom Resource nodes.
   */
  public static pruneCustomResources(): IGraphStoreFilter {
    return {
      filter: (store) => {
        store.root
          .findAll({
            predicate: {
              filter: (node) => {
                return node.hasFlag(FlagEnum.CUSTOM_RESOURCE);
              },
            },
          })
          .forEach((customResource) => {
            if (customResource.isDestroyed) return;

            customResource.mutateDestroy();
          });
      },
    };
  }

  /**
   * Prune empty containers, which are non-resource default nodes without any children.
   *
   * Generally L3 constructs in which all children have already been pruned, which
   * would be useful as containers, but without children are considered extraneous.
   */
  public static pruneEmptyContainers(): IGraphStoreFilter {
    return {
      filter: (store) => {
        store.root
          .findAll({
            predicate: {
              filter: (node) => {
                if (node.nodeType !== NodeTypeEnum.DEFAULT) return false;
                if (!node.isLeaf) return false;
                if (node.cfnType) return false;
                if (node.constructInfoFqn?.startsWith("aws-cdk-lib."))
                  return false;
                return true;
              },
            },
          })
          .forEach((node) => {
            if (node.isDestroyed) return;

            node.mutateDestroy();
          });
      },
    };
  }

  /**
   * Collapses extraneous nodes to parent and cdk created nodes on themselves,
   * and prunes extraneous edges.
   *
   * This most closely represents the developers code for the current application
   * and reduces the noise one expects.
   *
   * Invokes:
   * 1.
   * 1. pruneExtraneous()(store);
   * 1. collapseCdkOwnedResources()(store);
   * 1. collapseCdkWrappers()(store);
   * 1. collapseCustomResources()(store);
   * 1. ~pruneCustomResources()(store);~
   * 1. pruneEmptyContainers()(store);
   *
   * @throws Error if store is not filterable
   * @destructive
   */
  public static compact(): IGraphStoreFilter {
    return {
      filter: (store) => {
        Filters.verifyFilterable(store);

        Filters.pruneExtraneous().filter(store);
        Filters.collapseCdkOwnedResources().filter(store);
        Filters.collapseCdkWrappers().filter(store);
        Filters.collapseCustomResources().filter(store);
        // TODO: decide if we should prune custom resources in "compact"
        // pruneCustomResources()(store);
        Filters.pruneEmptyContainers().filter(store);
      },
    };
  }

  /**
   * @internal
   */
  public static _filterNodeType(
    values: FilterValue[],
    exclude: boolean
  ): IGraphStoreFilter {
    const isMatch = memoize((input: string) => {
      if (input == null) {
        return false;
      }

      return (
        values.find((_value) => {
          if (_value.value) {
            return input === _value.value;
          } else if (_value.regex) {
            return new RegExp(_value.regex).test(input);
          } else {
            return undefined;
          }
        }) != null
      );
    });

    return {
      filter: (store) => {
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
      },
    };
  }

  /**
   * Prune all {@link Graph.Node}s *except those matching* specified list.
   *
   * This filter targets all nodes (except root) - {@link IGraphFilter.allNodes}
   * @throws Error if store is not filterable
   * @destructive
   */
  public static includeNodeType(nodeTypes: FilterValue[]): IGraphStoreFilter {
    return Filters._filterNodeType(nodeTypes, false);
  }

  /**
   * Prune all {@link Graph.Node}s *matching* specified list.
   *
   * This filter targets all nodes (except root) - {@link IGraphFilter.allNodes}
   * @throws Error if store is not filterable
   * @destructive
   */
  public static excludeNodeType(nodeTypes: FilterValue[]): IGraphStoreFilter {
    return Filters._filterNodeType(nodeTypes, true);
  }

  /**
   * @internal
   */
  public static _filterCfnType(
    values: FilterValue[],
    exclude: boolean
  ): IGraphFilter {
    const isMatch = memoize((input: string) => {
      if (input == null) {
        return false;
      }

      return (
        values.find((_value) => {
          if (_value.value) {
            return input === _value.value;
          } else if (_value.regex) {
            return new RegExp(_value.regex).test(input);
          } else {
            return undefined;
          }
        }) != null
      );
    });

    return {
      strategy: FilterStrategy.PRUNE,
      node: {
        filter: (node) => {
          // Preserve container structure (stages, stacks, etc.)
          if (node.isCluster || node.isGraphContainer) return true;
          if (Graph.isResourceLike(node)) {
            const match = !!node.cfnType && isMatch(node.cfnType);
            return (match && !exclude) || (!match && exclude);
          }
          // Preserve non *Resource nodes
          return true;
        },
      },
    };
  }

  /**
   * Prune all {@link Graph.ResourceNode} and {@link Graph.CfnResourceNode} nodes
   * *except those matching* specified list of CloudFormation types.
   * @throws Error if store is not filterable
   * @destructive
   */
  public static includeCfnType(cfnTypes: FilterValue[]): IGraphFilter {
    return Filters._filterCfnType(cfnTypes, false);
  }

  /**
   * Prune all {@link Graph.ResourceNode} and {@link Graph.CfnResourceNode} nodes
   * *matching* specified list of CloudFormation types.
   * @throws Error if store is not filterable
   * @destructive
   */
  public static excludeCfnType(cfnTypes: FilterValue[]): IGraphFilter {
    return Filters._filterCfnType(cfnTypes, true);
  }

  /**
   * Remove clusters by hoisting their children to the parent of the cluster
   * and collapsing the cluster itself to its parent.
   * @param clusterTypes
   * @throws Error if store is not filterable
   * @see {@link Graph.Node.mutateUncluster}
   * @destructive
   */
  public static uncluster(clusterTypes?: NodeTypeEnum[]): IGraphStoreFilter {
    // Use set for constant lookup
    const clusterTypesSet = new Set<NodeTypeEnum>(clusterTypes);

    return {
      filter: (store): void => {
        Filters.verifyFilterable(store);

        const clusters = store.root.findAll({
          predicate: {
            filter: (node) => {
              if (node.isGraphContainer) return false;
              if (clusterTypesSet.size === 0) return node.isCluster;
              return clusterTypesSet.has(node.nodeType);
            },
          },
        });

        for (const cluster of clusters) {
          cluster.mutateUncluster();
        }
      },
    };
  }
}
