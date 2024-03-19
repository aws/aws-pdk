/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, Project } from "projen";
import * as readPkg from "read-pkg-up";

/**
 * Utility for projen projects
 * @experimental
 */
export namespace ProjectUtils {
  /**
   * List all parent class names of the given class (includes the given class's name as the last element)
   * @internal
   */
  function listParentClassNames(clazz?: {
    new (...args: any[]): any;
  }): string[] {
    if (!clazz?.name) {
      return [];
    }
    return [...listParentClassNames(Object.getPrototypeOf(clazz)), clazz.name];
  }

  /**
   * Returns whether the given project is an instance of the given project class.
   * Uses the class name to perform this check, such that the check still passes for
   * classes imported from mismatching package versions.
   */
  export function isNamedInstanceOf<
    TParent extends Project | Component,
    TChild extends TParent
  >(
    instance: TParent,
    clazz: { new (...args: any[]): TChild }
  ): instance is TChild {
    return new Set(listParentClassNames(instance.constructor as any)).has(
      clazz.name
    );
  }

  /**
   * Get the current PDK version
   */
  export function getPdkVersion() {
    const { packageJson } = readPkg.sync({
      cwd: path.resolve(__dirname),
    })!;
    return packageJson.version;
  }
}
