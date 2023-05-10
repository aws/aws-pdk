/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/**
 * ICounterRecord is record of keyed counts from {@link Counters}.
 *
 * The record is a mapping of `key => count` values.
 */
export type ICounterRecord = {
  /**
   * Counter key => count value properties
   */
  [key: string]: number;
};

/**
 * Counter class provides utils for adding/subtracting key based counts.
 *
 * For example, you can create a counter to track number of each CfnResourceType based on resource type key.
 *
 * @internal
 */
export class Counter<T = string> {
  /** @internal */
  private _counts: Map<T, number> = new Map();

  /** Gets record of keyed counts */
  get counts(): ICounterRecord {
    return Object.fromEntries(this._counts);
  }

  /** Increment key count by 1 */
  add(key: T): number {
    const count = (this._counts.get(key) || 0) + 1;
    this._counts.set(key, count);
    return count;
  }

  /** Decrement key count by 1 */
  subtract(key: T): number {
    const count = (this._counts.get(key) || 0) - 1;
    if (count < 0) {
      throw new Error(`Attempt to subtract count from zero`);
    }
    this._counts.set(key, count);
    return count;
  }

  /** Gets the current count for given key */
  getCount(key: T): number {
    return this._counts.get(key) || 0;
  }
}
