/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Graph } from "../core";

/** @internal */
export function findReferencesOfSubGraph(subgraph: Graph.Node): Graph.Node[] {
  const chain = new Set<Graph.Node>();

  function follow(_node: Graph.Node) {
    for (const _ref of _node.references) {
      if (_ref === subgraph || chain.has(_ref)) continue;
      chain.add(_ref);
      follow(_ref);
    }

    for (const child of _node.children) {
      follow(child);
    }
  }

  follow(subgraph);

  return Array.from(chain);
}
