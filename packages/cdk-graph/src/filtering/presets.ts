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
import { FlagEnum, Graph } from "../core";
import { IGraphFilterPlan } from "./types";

/**
 * Verify that store is filterable, meaning it allows destructive mutations.
 * @throws Error if store is not filterable
 * @internal
 */
export function verifyFilterable(store: Graph.Store): void {
  if (!store.allowDestructiveMutations) {
    throw new Error(
      "Store must allow destructive mutations to perform filtering; clone the store before applying filters using `store.clone(true)` operation and passing the cloned store to filtering operation."
    );
  }
}

/**
 * Changes the root of the store based on filter plan.
 * @throws Error if store is not filterable
 * @internal
 * @destructive
 */
export function rerootFilter(store: Graph.Store, plan: IGraphFilterPlan): void {
  verifyFilterable(store);

  if (plan.root == null) return; // noop

  const planRoot =
    typeof plan.root === "function" ? plan.root(store) : plan.root;

  if (planRoot === store.root) return; // noop

  const hoist = !!plan.hoistRoot;

  const ancestors = planRoot.scopes.slice();
  // remove the actual store.root from ancestors (we can't destroy that)
  const rootAncestor = ancestors.shift();

  if (rootAncestor !== store.root) {
    throw new Error(
      `${planRoot} is not within the store root graph: it has root of ${rootAncestor}`
    );
  }

  if (hoist) {
    // Move plan root as direct child of store root and prune all other ancestors
    planRoot.mutateHoist(store.root);
    // Only need to destroy to first non-root ancestor to prune the ancestral tree
    if (ancestors.length) {
      ancestors[0].mutateDestroy();
    }
    // prune all other root children
    store.root.children.forEach((child) => {
      if (child !== planRoot) {
        child.mutateDestroy();
      }
    });
  } else {
    // keep the plan root in place, but prune non-direct ancestor chain nodes
    // the direct ancestor chain is only the nodes scopes
    ancestors.reverse().forEach((ancestor) => {
      ancestor.siblings.forEach((ancestorSibling) => {
        ancestorSibling.mutateDestroy();
      });
    });

    // prune all planRoot siblings
    planRoot.siblings.forEach((sibling) => {
      sibling.mutateDestroy();
    });
  }
}

/**
 * Performs **compact** filter preset to store.
 * @throws Error if store is not filterable
 * @internal
 * @destructive
 */
export function compactFilterPreset(store: Graph.Store): void {
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

  store.edges.forEach((edge) => {
    if (edge.isExtraneous) {
      edge.mutateDestroy();
    }
  });
}
