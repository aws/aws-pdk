/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ConstructOrder } from "constructs";
import { Graph } from "../core";
import * as presets from "./presets";
import { FilterPreset, FilterStrategy, IGraphFilterPlan } from "./types";

export * from "./types";

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
  presets.verifyFilterable(store);

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
    const nodes: Graph.Node[] = store.root.findAll({
      order: plan.order || ConstructOrder.PREORDER,
      predicate: (node) => {
        // never filter store root
        if (node === store.root) return false;
        if (plan.allNodes) return true;
        // by default only return Resources and CfnResources
        return (
          Graph.ResourceNode.isResourceNode(node) ||
          Graph.CfnResourceNode.isCfnResourceNode(node)
        );
      },
    });

    for (const filter of plan.filters) {
      const inverse = filter.inverse === true;

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
    }

    const edges: Graph.Edge[] = store.edges;

    for (const filter of plan.filters) {
      const inverse = filter.inverse === true;

      if (filter.edge) {
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
