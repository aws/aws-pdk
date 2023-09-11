#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "node:fs";
import { promisify } from "node:util";
import { AwsArchitecture } from "@aws/aws-arch";
import * as svgson from "svgson";
import { Image } from "./types";
import {
  addGraphFontCssStyles,
  extractSvgDimensions,
  reconcileViewBox,
  resolveSvgAwsArchAssetImagesInline,
  unescapeSvgTextValues,
} from "../../utils/svg";

const readFile = promisify(fs.readFile);

/**
 * Resolve image path to [dot-wasm](https://hpcc-systems.github.io/hpcc-js-wasm/classes/graphviz.Graphviz.html) image
 * struct which requires width and height dimensions.
 */
export async function resolveDotWasmImage(
  relativePath: string
): Promise<Image> {
  const absolutePath = AwsArchitecture.resolveAssetPath(relativePath);
  const svgString = await readFile(absolutePath, { encoding: "utf-8" });
  const dimensions = await extractSvgDimensions(svgString);

  return {
    path: absolutePath,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Resolve [dot-wasm](https://hpcc-systems.github.io/hpcc-js-wasm/classes/graphviz.Graphviz.html) generated svg.
 *
 * **dot-wasm** (as well as Graphviz) generate non-desirable svg state which this function resolves:
 * 1. Unescape/Decode all html entities (eg: `&#45;` => `-`)
 * 2. Reconcile the `viewBox` size to match graph content
 * 3. Remove width and height from root svg, to ensure pure viewBox is utilized without side effects
 * 4. Resolve font **config** values to proper html/svg font-family and styles
 * 5. Inline all svg images via definitions
 */
export async function resolveSvg(svgString: string): Promise<string> {
  const svg = await svgson.parse(svgString);

  unescapeSvgTextValues(svg);

  // The resulting svg from graphviz (both dot and dot-wasm) have incorrect viewBox and width/height attributes
  // viewBox="0.00 0.00 494.00 508.00" => viewBox="0 0 2058.33498 2116.66836"
  // from container with transform="scale(4.16667 4.16667) rotate(0) translate(4 504)"
  reconcileViewBox(svg);

  addGraphFontCssStyles(svg);

  await resolveSvgAwsArchAssetImagesInline(svg);

  return svgson.stringify(svg);
}
