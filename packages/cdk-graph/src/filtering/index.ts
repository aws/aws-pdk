/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
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

  if (plan.root) {
    presets.rerootFilter(store, plan);
  }

  if (plan.preset) {
    if (plan.preset === FilterPreset.COMPACT) {
      presets.compactFilterPreset(store);
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
