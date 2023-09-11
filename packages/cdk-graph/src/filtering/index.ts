/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ConstructOrder } from "constructs";
import { Filters } from "./filters";
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
  Filters.verifyFilterable(store);

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
      if (filter.store) {
        // IGraphStoreFilter
        filter.store.filter(store);
      } else if (filter.graph) {
        // IGraphFilter
        const _filter = filter.graph;
        const inverse = _filter.inverse === true;
        const allNodes =
          _filter.allNodes != null ? _filter.allNodes : plan.allNodes === true;

        const nodes: Graph.Node[] = store.root.findAll({
          order: plan.order || ConstructOrder.PREORDER,
          predicate: {
            filter: (node) => {
              if (allNodes) return true;
              // by default only return Resources and CfnResources
              return Graph.isResourceLike(node);
            },
          },
        });

        if (_filter.node) {
          for (const node of nodes) {
            if (node.isDestroyed) continue;

            const match = _filter.node.filter(node);

            if ((match && inverse) || (!match && !inverse)) {
              switch (_filter.strategy || FilterStrategy.PRUNE) {
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

        if (_filter.edge) {
          const edges: Graph.Edge[] = store.edges;

          for (const edge of edges) {
            if (edge.isDestroyed) continue;

            const match = _filter.edge.filter(edge);

            if ((match && inverse) || (!match && !inverse)) {
              edge.mutateDestroy();
            }
          }
        }
      }
    }
  }
}
