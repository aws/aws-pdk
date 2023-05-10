/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { JsiiProject } from "projen/lib/cdk";
import { JavaProject } from "projen/lib/java";
import { Jest } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { Nx } from "../../nx-types";

function projectRoot(fileset: string): string {
  const inverse = fileset.startsWith("!");
  if (inverse) {
    fileset = fileset.substring(1);
  }
  if (fileset.startsWith("{")) {
    return fileset;
  }
  if (!fileset.startsWith("/")) {
    fileset = "/" + fileset;
  }
  fileset = "{projectRoot}" + fileset;
  if (inverse) {
    return "!" + fileset;
  }
  return fileset;
}

/** @struct */
export interface InferBuildTargetOptions {
  /**
   * Indicates if outputs are automatically excluded from inputs.
   * @default true
   */
  readonly excludeOutputs?: boolean;

  /**
   * Specifies how `dependsOn` for the target is derived.
   * - If `false`, no `dependsOn` will be added.
   * - If `true`, the default `^build` will be used.
   * - If explicit list of strings, the value will be used.
   */
  readonly dependsOn?: boolean | string[];
}

/**
 * Infer nx target values for build task
 * @experimental
 * @internal
 */
export function inferBuildTarget(
  project: Project,
  options?: InferBuildTargetOptions
): Nx.IProjectTarget | undefined {
  const { inputs = [], outputs = [] } = _inferBuildTargetIO(project);

  if (options?.excludeOutputs !== false) {
    inputs.push(...outputs.flatMap((o) => [`!${o}`, `!${o}/**/*`]));
  }

  let dependsOn: string[] | undefined = ["^build"];
  if (options?.dependsOn != null && options.dependsOn !== true) {
    if (options.dependsOn === false) {
      dependsOn = undefined;
    } else {
      dependsOn = options.dependsOn;
    }
  }

  if (outputs.length === 0) {
    return undefined;
  }

  return {
    inputs,
    outputs,
    dependsOn,
  };
}

/** @internal */
function _inferBuildTargetIO(project: Project): Nx.IProjectTarget {
  const inputs: Nx.Inputs = [];
  const outputs: Nx.Outputs = [];
  let includeDefaultInputs = true;

  if (project instanceof JsiiProject) {
    outputs.push(
      ...[".jsii", project.libdir, project.artifactsDirectory].map(projectRoot)
    );
  }

  if (Jest.of(project)) {
    outputs.push(...["coverage", "test-reports"].map(projectRoot));
  }

  if (project instanceof PythonProject) {
    inputs.push(...["!.env", "!.pytest_cache"].map(projectRoot));
    // TODO: are there any outputs for python project?
  }

  if (project instanceof JavaProject) {
    inputs.push(...["!.classpath", "!.project", "!.settings"].map(projectRoot));
    outputs.push(...["target", "dist/java"].map(projectRoot));
  }

  if (includeDefaultInputs) {
    inputs.unshift("default", "^default");
  }

  return {
    inputs,
    outputs,
  };
}
