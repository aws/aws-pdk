#!/usr/bin/env node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { readFile } from "node:fs";
import { promisify } from "node:util";
import { Graphviz } from "@hpcc-js/wasm/graphviz";

(
  /**
   * Invoke `dot-wasm` with image support.
   *
   * [dot-wasm cli](https://hpcc-systems.github.io/hpcc-js-wasm/graphviz-cli.html) does not support
   * images which was added in [PR] (https://github.com/hpcc-systems/hpcc-js-wasm/pull/13).
   *
   * Furthermore, we need to run wasm in a shell so we can not inline [Wasm Graphviz](https://hpcc-systems.github.io/hpcc-js-wasm/classes/graphviz.Graphviz.html)
   * as documented, so this executable script exists to shim these gaps.
   *
   * @internal
   */
  async function main() {
    const inputFile = process.argv[2];
    const options = JSON.parse(Buffer.from(process.argv[3], "base64").toString("utf-8"));

    const graphviz = await Graphviz.load();

    const dot = await promisify(readFile)(inputFile, { encoding: "utf-8" });
    const response = graphviz.layout(dot, "svg", "dot", options);
    // Write resulting response to console for caller to receive
    console.log(response);
  }
)();
