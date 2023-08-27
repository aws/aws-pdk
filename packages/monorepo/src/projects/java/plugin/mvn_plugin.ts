/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { ProjectGraphBuilder, ProjectGraph } from "@nx/devkit";

export function processProjectGraph(graph: ProjectGraph): ProjectGraph {
  const builder = new ProjectGraphBuilder(graph);
  const rootNode = Object.keys(graph.nodes).reduce(
    (_: string | undefined, k: string) =>
      graph.nodes[k].data.root === "" ? graph.nodes[k].name : undefined,
    undefined
  );

  rootNode && builder.removeNode(rootNode);

  // We will see how this is used below.
  return builder.getUpdatedProjectGraph();
}
