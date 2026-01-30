/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { isObject } from "projen/lib/util";

/**
 * Utility to deeply clone a value
 * @param value Value to clone
 * @returns Cloned value
 */
export function cloneDeep(value: any): any {
  return JSON.parse(JSON.stringify(value));
}

/** Indicates if value is considered empty */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === "boolean") {
    return false;
  }
  if (typeof value === "string") {
    return value.length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }
  return false;
}

/** Replace empty value with undefined */
export function asUndefinedIfEmpty(value: any): any | undefined {
  if (isEmpty(value)) return undefined;
  return value;
}
