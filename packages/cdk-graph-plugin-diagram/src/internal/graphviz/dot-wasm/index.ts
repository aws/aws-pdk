#!/usr/bin/env ts-node
/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "node:path";
import execa = require("execa"); // eslint-disable-line @typescript-eslint/no-require-imports
import { Options } from "./types";
import { resolveDotWasmImage, resolveSvg } from "./utils";
import { FONT_FAMILY } from "../../fonts";

/**
 * Invoke `dot-wasm` in shell with image support.
 * @param inputFile - The input dot file
 * @param absoluteAssetPaths - List of absolute asset paths to provide to dot-wasm
 * @returns The generated svg string
 *
 * @internal
 */
export async function invokeDotWasm(
  inputFile: string,
  absoluteAssetPaths: string[]
): Promise<string> {
  const invoker = path.resolve(__dirname, "dot-wasm-invoker.mjs");
  const options: Options = {
    images: await Promise.all(
      absoluteAssetPaths.map((v) => resolveDotWasmImage(v))
    ),
  };

  const encodedOptions: string = Buffer.from(
    JSON.stringify(options),
    "utf-8"
  ).toString("base64");
  const response = await execa.node(invoker, [inputFile, encodedOptions], {
    shell: true,
  });

  logDotWasmErrors(response.stderr);

  return resolveSvg(response.stdout);
}

/** Filtered logging of dot-wasm stderr */
function logDotWasmErrors(stderr: string): void {
  stderr.split("\n").forEach((line) => {
    // Ignore font mapping issues - they are resolved by svg rendering itself
    if (
      !line.startsWith(`Warning: no hard-coded metrics for '${FONT_FAMILY}'`)
    ) {
      console.warn("[dot-wasm]", line);
    }
  });
}
