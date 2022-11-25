/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as Dot from "ts-graphviz";
import { GraphTheme } from "../theme";

/**
 * Diagram class defines the root {@link Dot.Digraph} of the diagram
 * @internal
 */
export class Diagram extends Dot.Digraph {
  /** @internal */
  private readonly _trackedImages: Set<string>;

  /** Image path attribute of the diagram used to prefix relative paths */
  readonly imagepath: string;

  /** @internal */
  constructor(label: string, imagepath: string) {
    const { graph, node, edge } = GraphTheme.instance;
    super("ROOT", {
      label,
      imagepath,
    });

    this._trackedImages = new Set<string>();

    this.imagepath = imagepath;

    this.apply(graph);

    // NB: do not apply "subgraph" attributes as there seems to be bug where it overrides the diagram attributes
    // The subgraph class will apply them directly so not a concern

    this.attributes.node.apply(node);
    this.attributes.edge.apply(edge);
  }

  /**
   * Track image used in the graph for downstream tooling support integration.
   *
   * @see [dot-wasm options](https://hpcc-systems.github.io/hpcc-js-wasm/classes/graphviz.Graphviz.html#layout)
   * @param image Image to track
   */
  trackImage(image: string): void {
    this._trackedImages.add(image);
  }

  /** Get list of all tracked images */
  getTrackedImages(): string[] {
    return Array.from(this._trackedImages);
  }

  /**
   * Converts the diagram to **dot** string format
   * @see {@link Dot.toDot}
   */
  toDot(): string {
    return Dot.toDot(this);
  }
}
