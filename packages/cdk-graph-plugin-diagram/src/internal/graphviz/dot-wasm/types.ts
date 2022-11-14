/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/**
 * dot-wasm `Image` definition
 * @see https://github.com/hpcc-systems/hpcc-js-wasm/blob/c6f4e91a8c7c37bac991f5e4eb4794622b7009e0/src/graphviz.ts#L8-L25
 * @internal
 */
export interface Image {
  /**
   * Absolute image path
   */
  path: string;
  /** Image width */
  width: string;
  /** Image height */
  height: string;
}

/**
 * dot-wasm `Image` definition
 * @see https://github.com/hpcc-systems/hpcc-js-wasm/blob/c6f4e91a8c7c37bac991f5e4eb4794622b7009e0/src/graphviz.ts#L8-L25
 * @internal
 */
export interface File {
  /** Absolute file path */
  path: string;
  /** File data */
  data: string;
}

/**
 * dot-wasm `Options` definition
 * @see https://github.com/hpcc-systems/hpcc-js-wasm/blob/c6f4e91a8c7c37bac991f5e4eb4794622b7009e0/src/graphviz.ts#L8-L25
 * @see https://hpcc-systems.github.io/hpcc-js-wasm/graphviz-cli.html
 * @internal
 */
export interface Options {
  /** Images */
  images?: Image[];
  /** Files */
  files?: File[];
  /** yInvert option */
  yInvert?: boolean;
  /** Noop */
  nop?: number;
}
