/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ConstructOrder } from "constructs";
import { verifyFilterable } from "./filters";
import * as presets from "./presets";
import { FilterPreset, FilterStrategy, IGraphFilterPlan } from "./types";
import { Graph } from "../core";

export * from "./types";
export * from "./filters";

/**
 * Perform graph filter plan on store.
 *
 * This operation is performed *in-place* and is destructive, therefore can only be applied
 * on stores that allow destructive mutations.
 * @param {Graph.Store} store - The store to perform filter plan against
 * @param {IGraphFilterPlan} plan - The filter plan to apply
 * @throws Error is store does not allow destructive mutations
 * @destructive
 */
export function performGraphFilterPlan(
  store: Graph.Store,
  plan: IGraphFilterPlan
): void {
  verifyFilterable(store);

  if (plan.focus) {
    presets.focusFilter(store, plan);
  }

  if (plan.preset) {
    switch (plan.preset) {
      case FilterPreset.NON_EXTRANEOUS: {
        presets.nonExtraneousFilterPreset(store);
        break;
      }
      case FilterPreset.COMPACT: {
        presets.compactFilterPreset(store);
        break;
      }
    }
  }

  if (plan.filters) {
    for (const filter of plan.filters) {
      if (typeof filter === "function") {
        // IGraphStoreFilter
        filter(store);
      } else {
        // IGraphFilter
        const inverse = filter.inverse === true;
        const allNodes =
          filter.allNodes != null ? filter.allNodes : plan.allNodes === true;

        const nodes: Graph.Node[] = store.root.findAll({
          order: plan.order || ConstructOrder.PREORDER,
          predicate: (node) => {
            if (allNodes) return true;
            // by default only return Resources and CfnResources
            return Graph.isResourceLike(node);
          },
        });

        if (filter.node) {
          for (const node of nodes) {
            if (node.isDestroyed) continue;

            const match = filter.node(node);

            if ((match && inverse) || (!match && !inverse)) {
              switch (filter.strategy || FilterStrategy.PRUNE) {
                case FilterStrategy.PRUNE: {
                  node.mutateDestroy();
                  break;
                }
                case FilterStrategy.COLLAPSE: {
                  node.mutateCollapse();
                  break;
                }
                case FilterStrategy.COLLAPSE_TO_PARENT: {
                  node.mutateCollapseToParent();
                  break;
                }
              }
            }
          }
        }

        if (filter.edge) {
          const edges: Graph.Edge[] = store.edges;

          for (const edge of edges) {
            if (edge.isDestroyed) continue;

            const match = filter.edge(edge);

            if ((match && inverse) || (!match && !inverse)) {
              edge.mutateDestroy();
            }
          }
        }
      }
    }
  }
}
