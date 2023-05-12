/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { JsiiProject } from "projen/lib/cdk";
import { JavaProject } from "projen/lib/java";
import { Jest } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { Nx } from "../../nx-types";

/**
 * Defines a fileset for target inputs and outputs.
 * @experimental
 * @internal
 */
class TargetFileset {
  static File(
    fileset: string,
    isWorkspaceRoot: boolean = false
  ): TargetFileset {
    return new TargetFileset(fileset, false, isWorkspaceRoot);
  }
  static Directory(
    fileset: string,
    isWorkspaceRoot: boolean = false
  ): TargetFileset {
    return new TargetFileset(fileset, true, isWorkspaceRoot);
  }

  static resolveInputs(values: (string | TargetFileset)[]): string[] {
    return values.map((v) => (typeof v === "string" ? v : v.filesetStarIfDir));
  }

  static resolveOutputs(values: (string | TargetFileset)[]): string[] {
    return values.map((v) => (typeof v === "string" ? v : v.fileset));
  }

  static outputsToInputs(values: (string | TargetFileset)[]): string[] {
    return values.map((v) =>
      typeof v === "string" ? v : v.inverse().filesetStarIfDir
    );
  }

  /** The glob pattern for the fileset */
  private readonly _fileset: string;
  /** Indicates if fileset is for a directory */
  public readonly isDirectory: boolean;
  /** Indicates if fileset is excluded (starts with !) */
  public readonly isExclude: boolean;
  /** Indicates if fileset is for workspace root, if not is considered project root */
  public readonly isWorkspaceRoot: boolean;

  private constructor(
    fileset: string,
    isDirectory: boolean,
    isWorkspaceRoot: boolean
  ) {
    this._fileset = fileset;
    this.isDirectory = isDirectory;
    this.isExclude = this._fileset.startsWith("!");
    this.isWorkspaceRoot = isWorkspaceRoot;
  }

  private _ensureWildcards(fileset: string): string {
    if (fileset.endsWith("*")) {
      return fileset;
    }
    if (fileset.endsWith("/")) {
      return fileset + "**/*";
    }
    return fileset + "/**/*";
  }

  get fileset(): string {
    let fileset = this.isExclude ? this._fileset.substring(1) : this._fileset;
    if (fileset.startsWith("/")) {
      fileset = fileset.substring(1);
    }
    if (this.isWorkspaceRoot) {
      return `${this.isExclude ? "!" : ""}{workspaceRoot}/${fileset}`;
    }
    return `${this.isExclude ? "!" : ""}{projectRoot}/${fileset}`;
  }

  inverse(): TargetFileset {
    if (this.isExclude) {
      return new TargetFileset(
        this._fileset.substring(1),
        this.isDirectory,
        this.isWorkspaceRoot
      );
    }

    return new TargetFileset(
      "!" + this._fileset,
      this.isDirectory,
      this.isWorkspaceRoot
    );
  }

  get filesetStarIfDir(): string {
    if (this.isDirectory) {
      return this._ensureWildcards(this.fileset);
    }

    return this.fileset;
  }
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
    inputs.push(...TargetFileset.outputsToInputs(outputs));
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
    inputs: TargetFileset.resolveInputs(inputs),
    outputs: TargetFileset.resolveOutputs(outputs),
    dependsOn,
  };
}

interface InferedTargetFilesets {
  readonly inputs: (TargetFileset | string)[];
  readonly outputs: (TargetFileset | string)[];
}

/** @internal */
function _inferBuildTargetIO(project: Project): InferedTargetFilesets {
  const inputs: (TargetFileset | string)[] = [];
  const outputs: (TargetFileset | string)[] = [];
  let includeDefaultInputs = true;

  if (project instanceof JsiiProject) {
    outputs.push(
      TargetFileset.File(".jsii"),
      TargetFileset.Directory(project.libdir),
      TargetFileset.Directory(project.artifactsDirectory)
    );
  }

  if (Jest.of(project)) {
    outputs.push(
      TargetFileset.Directory("coverage"),
      TargetFileset.Directory("test-reports")
    );
  }

  if (project instanceof PythonProject) {
    inputs.push(
      TargetFileset.Directory("!.env"),
      TargetFileset.Directory("!.pytest_cache")
    );
  }

  if (project instanceof JavaProject) {
    inputs.push(
      TargetFileset.File("!.classpath"),
      TargetFileset.File("!.project"),
      TargetFileset.File("!.settings")
    );
    outputs.push(
      TargetFileset.Directory("target"),
      TargetFileset.Directory("dist/java")
    );
  }

  if (includeDefaultInputs) {
    inputs.unshift("default", "^default");
  }

  return {
    inputs,
    outputs,
  };
}
