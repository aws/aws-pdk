/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Filters, verifyFilterable } from "./filters";
import { IGraphFilterPlan, IGraphFilterPlanFocusConfig } from "./types";
import { Graph } from "../core";

/**
 * Focus the graph on a specific node.
 * @throws Error if store is not filterable
 * @destructive
 */
export function focusFilter(store: Graph.Store, plan: IGraphFilterPlan): void {
  verifyFilterable(store);

  if (plan.focus == null) return; // noop

  let focusedNode: Graph.Node;
  let hoist: boolean = true;
  if (typeof plan.focus === "function") {
    focusedNode = plan.focus(store);
  } else if (plan.focus instanceof Graph.Node) {
    focusedNode = plan.focus;
  } else {
    const { node: _node, noHoist: _noHoist } =
      plan.focus as IGraphFilterPlanFocusConfig;
    if (typeof _node === "function") {
      focusedNode = _node(store);
    } else {
      focusedNode = _node;
    }
    hoist = !_noHoist;
  }

  if (focusedNode === store.root) return; // noop

  const ancestors = focusedNode.scopes.slice();
  // remove the actual store.root from ancestors (we can't destroy that)
  const rootAncestor = ancestors.shift();

  if (rootAncestor !== store.root) {
    throw new Error(
      `${focusedNode} is not within the store root graph: it has root of ${rootAncestor}`
    );
  }

  if (hoist) {
    // Move focused node as direct child of store root and prune all other ancestors
    focusedNode.mutateHoist(store.root);

    // Only need to destroy to first non-root ancestor to prune the ancestral tree
    if (ancestors.length) {
      ancestors[0].mutateDestroy();
    }
    // prune all other root children (unless preserved)
    store.root.children.forEach((child) => {
      if (child !== focusedNode) {
        child.mutateDestroy();
      }
    });
  } else {
    // keep the focused node in place, but prune non-direct ancestor chain nodes
    // the direct ancestor chain is only the nodes scopes
    ancestors.reverse().forEach((ancestor) => {
      ancestor.siblings.forEach((ancestorSibling) => {
        ancestorSibling.mutateDestroy();
      });
    });

    // prune all planRoot siblings
    focusedNode.siblings.forEach((sibling) => {
      sibling.mutateDestroy();
    });
  }
}

/**
 * Preset that performs {@link Filters.pruneExtraneous} filter on store.
 * @throws Error if store is not filterable
 * @destructive
 */
export function nonExtraneousFilterPreset(store: Graph.Store): void {
  return Filters.pruneExtraneous()(store);
}

/**
 * Preset that performs {@link Filters.compact} filter on store.
 * @throws Error if store is not filterable
 * @destructive
 */
export function compactFilterPreset(store: Graph.Store): void {
  Filters.compact()(store);
}
