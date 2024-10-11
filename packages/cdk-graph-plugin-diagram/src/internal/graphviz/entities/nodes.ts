/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Graph } from "@aws/cdk-graph";
import startCase = require("lodash.startcase"); // eslint-disable-line @typescript-eslint/no-require-imports
import words = require("lodash.words"); // eslint-disable-line @typescript-eslint/no-require-imports
import * as Dot from "ts-graphviz";
import wordWrap = require("word-wrap"); // eslint-disable-line @typescript-eslint/no-require-imports
import {
  resolveCfnResourceImage,
  resolveCustomResourceImage,
  resolveResourceImage,
} from "../../utils/resource-images";
import { GraphTheme } from "../theme";

/** Diagram label line height */
const LABEL_LINE_HEIGHT = 0.23;
/** Diagram label line max chars */
const LABEL_LINE_MAX_CHARS = 15;
/** Diagram label max number of lines */
const LABEL_MAX_LINES = 5;

/**
 * Parsed label structure used for marshalling label rendering
 */
interface MarshalledLabel {
  /** Resulting label after transforming */
  readonly label: string;
  /** Reference to original label before processing */
  readonly original: string;
  /** Number of lines in the resulting label */
  readonly lines: number;
}

/** Marshalls a label to contain length, output multi-line, etc for better rendering */
function marshallLabelForRendering(original: string): MarshalledLabel {
  let label = words(original).join(" ");
  label = wordWrap(label, {
    width: LABEL_LINE_MAX_CHARS,
    trim: true,
    indent: "",
  });
  const splitLabel = label.split("\n");
  const lines = splitLabel.slice(0, LABEL_MAX_LINES);
  // Ellipse last line if dropped lines
  if (splitLabel.length > lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1] + "...";
  }

  label = lines
    .map((line) => {
      line = startCase(line).replace(/ /g, "");
      if (line.length > LABEL_LINE_MAX_CHARS) {
        return line.substring(0, LABEL_LINE_MAX_CHARS) + "...";
      }
      return line;
    })
    .join("\n");

  return { original, label, lines: lines.length };
}

/**
 * Positional coordinates for a node
 */
export type NodePosition = { x: number; y: number };

/**
 * Node class defines a {@link Graph.Node} based diagram {@link Dot.Node}
 * @internal
 */
export class Node extends Dot.Node {
  /** Reference to the {@link Graph.Node} this diagram {@link Dot.Node} is based on  */
  readonly graphNode: Graph.Node;

  /** Get the label attribute for this node */
  get label(): string {
    return this.attributes.get("label") as string;
  }

  set position(pos: NodePosition) {
    this.attributes.set("pos", `${pos.x},${pos.y}!`);
  }

  /** @internal */
  constructor(node: Graph.Node) {
    super(`node_${node.uuid}`);

    this.graphNode = node;

    this.attributes.set("label", marshallLabelForRendering(node.id).label);
    this.attributes.set(
      "comment",
      `nodeType:${node.nodeType}` + (node.cfnType ? `(${node.cfnType})` : "")
    );
  }
}

/**
 * ImageNode class extends {@link Node} with support for rendering diagram images.
 * @internal
 */
export class ImageNode extends Node {
  /** @internal */
  constructor(node: Graph.Node, image?: string) {
    super(node);

    // If image not defined, treat as regular node
    if (image) {
      this.attributes.apply(GraphTheme.instance.imageNode);
      this.attributes.set("image", image);
      this.resize();
    }
  }

  /** Get `image` attribute */
  get image(): string | undefined {
    return this.attributes.get("image") as string | undefined;
  }

  /** Resizes the node based on image and label dimensions */
  resize(baseHeight?: number): void {
    if (baseHeight == null) {
      baseHeight = (this.attributes.get("height") || 1) as number;
    }
    const image = this.image;

    if (image) {
      const labelLines = this.label.split("\n").length;
      this.attributes.set("labelloc", "b");
      this.attributes.set(
        "height",
        baseHeight + labelLines * LABEL_LINE_HEIGHT
      );
    } else {
      this.attributes.set("labelloc", "c");
      this.attributes.set("penwidth", 0.25);
      this.attributes.set("height", baseHeight);
    }
  }
}

/**
 * CfnResourceNode class defines a {@link Dot.Node} based on a {@link Graph.CfnResourceNode}
 * @internal
 */
export class CfnResourceNode extends ImageNode {
  /** @internal */
  constructor(node: Graph.CfnResourceNode) {
    super(node, resolveCfnResourceImage(node));

    this.attributes.apply(GraphTheme.instance.cfnResourceNode);

    this.resize(
      GraphTheme.instance.cfnResourceNode.height === ""
        ? undefined
        : GraphTheme.instance.cfnResourceNode.height
    );

    if (node.isImport) {
      this.attributes.apply({
        style: "filled,dotted",
        penwidth: 1,
        fontcolor: (GraphTheme.instance.awsTheme?.text.tertiary ||
          "#55555") as Dot.Color,
        color: ((GraphTheme.instance.awsTheme?.text.tertiary || "#55555") +
          "33") as Dot.Color, // 20%
        fillcolor: ((GraphTheme.instance.awsTheme?.text.tertiary || "#55555") +
          "1A") as Dot.Color, // 10%
      });
    }
  }
}

/**
 * ResourceNode class defines a {@link Dot.Node} based on a {@link Graph.ResourceNode}
 * @internal
 */
export class ResourceNode extends ImageNode {
  /** @internal */
  constructor(node: Graph.ResourceNode) {
    const image = resolveResourceImage(node);
    super(node, image);

    this.attributes.apply(GraphTheme.instance.resourceNode);

    this.resize(
      GraphTheme.instance.resourceNode.height === ""
        ? undefined
        : GraphTheme.instance.resourceNode.height
    );
  }
}

/**
 * CustomResourceNode class defines a {@link Dot.Node} based on a {@link Graph.Node} for a *custom resource*
 * @internal
 */
export class CustomResourceNode extends ImageNode {
  /** @internal */
  constructor(node: Graph.Node) {
    super(node, resolveCustomResourceImage(node));
  }
}
