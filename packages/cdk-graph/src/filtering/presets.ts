/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ConstructOrder } from "constructs";
import { FlagEnum, Graph } from "../core";
import { IGraphFilterPlan, IGraphFilterPlanFocusConfig } from "./types";

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
 * Performs **non-extraneous** filter preset to store.
 * @throws Error if store is not filterable
 * @destructive
 */
export function nonExtraneousFilterPreset(store: Graph.Store): void {
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
}

/**
 * Performs **compact** filter preset to store.
 * @throws Error if store is not filterable
 * @destructive
 */
export function compactFilterPreset(store: Graph.Store): void {
  verifyFilterable(store);

  nonExtraneousFilterPreset(store);

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
}
