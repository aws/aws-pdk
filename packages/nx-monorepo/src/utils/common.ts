/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { relative } from "node:path";
import { Project } from "projen";
import { Obj, deepMerge as _deepMerge, isObject } from "projen/lib/util";

/** Get the relative output directory from the workspace root */
export function relativeOutdir(project: Project): string {
  if (project.root === project) {
    return "./";
  }

  return relative(project.root.outdir, project.outdir);
}

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

/** Options for deep merge function */
export interface DeepMergeOptions {
  /**
   * Append array values
   * @default false
   */
  readonly append?: boolean;
  /**
   * `undefined`s will cause a value to be deleted if destructive is enabled.
   * @default false
   */
  readonly destructive?: boolean;
}

/**
 * Recursively merge objects together into a new object with extends support for appending arrays.
 *
 * This is a clone of [projen/lib/util#deepMerge](https://github.com/projen/projen/blob/55ac3657a270285db63e1a6008b3848b36775626/src/util.ts#L218-L281)
 * with added functionality to support appending arrays.
 *
 * @see [projen/lib/util#deepMerge](https://github.com/projen/projen/blob/55ac3657a270285db63e1a6008b3848b36775626/src/util.ts#L218-L281)
 */
export function deepMerge(
  objects: Array<Obj<any>>,
  options?: DeepMergeOptions
): Obj<any> {
  const append = options?.append ?? false;
  const destructive = options?.destructive ?? false;

  objects = objects.map(cloneDeep);

  if (append === false) return _deepMerge(objects, destructive);

  function mergeOne(target: any, source: any) {
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (isObject(value)) {
        // if the value at the target is not an object, override it with an
        // object so we can continue the recursion
        if (typeof target[key] !== "object") {
          target[key] = value;
        }
        if (Array.isArray(value)) {
          if (Array.isArray(target[key])) {
            target[key].push(...value);
          } else {
            target[key] = value;
          }
        }
        mergeOne(target[key], value);
        // if the result of the merge is an empty object, it's because the
        // eventual value we assigned is `undefined`, and there are no
        // sibling concrete values alongside, so we can delete this tree.
        const output = target[key];
        if (
          typeof output === "object" &&
          Object.keys(output).length === 0 &&
          destructive
        ) {
          delete target[key];
        }
      } else if (value === undefined && destructive) {
        delete target[key];
      } else if (Array.isArray(value)) {
        if (Array.isArray(target[key])) {
          // Append to existing array
          target[key].push(...value);
        } else {
          // Override with array value
          target[key] = value;
        }
      } else if (typeof value !== "undefined") {
        target[key] = value;
      }
    }
  }
  const others = objects.filter((x) => x != null);
  if (others.length === 0) {
    return {};
  }
  const into = others.splice(0, 1)[0];
  others.forEach((other) => mergeOne(into, other));
  return into;
}
