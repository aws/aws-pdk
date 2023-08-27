/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Graph } from "../core";

/** @internal */
export function findReferencesOfSubGraph(
  subgraph: Graph.Node,
  depth?: number,
  predicate?: Graph.INodePredicate,
  strict: boolean = true
): Graph.Node[] {
  const chain = new Set<Graph.Node>();
  if (depth == null) {
    depth = Number.MAX_SAFE_INTEGER;
  }

  function follow(_node: Graph.Node, _depth: number) {
    if (_depth >= depth!) return;
    for (const _ref of _node.references) {
      if (predicate && !predicate.filter(_ref)) continue;
      if (_ref === subgraph || chain.has(_ref)) continue;
      chain.add(_ref);
      follow(_ref, _depth + 1);
    }

    for (const child of _node.children) {
      if (predicate && !predicate.filter(child)) continue;
      follow(child, _depth + 1);
    }
  }

  follow(subgraph, 0);

  if (strict) {
    for (const ref of chain) {
      if (
        ref.referencedBy.filter(
          (_by) =>
            !(_by === subgraph || _by.isAncestor(subgraph)) && !chain.has(_by)
        ).length
      ) {
        chain.delete(ref);
      }
    }
  }

  return Array.from(chain);
}
