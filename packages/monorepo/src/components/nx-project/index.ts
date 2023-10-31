/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, JsonFile, Project } from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager } from "projen/lib/javascript";
import { Poetry, PythonProject } from "projen/lib/python";
import { Obj } from "projen/lib/util";
import { inferBuildTarget } from "./targets";
import { Nx } from "../../nx-types";
import { NodePackageUtils, ProjectUtils } from "../../utils";
import { asUndefinedIfEmpty, deepMerge } from "../../utils/common";
import { NxWorkspace } from "../nx-workspace";

// List of tasks that are excluded from nx tasks for node projects
const NODE_LIFECYCLE_TASKS: string[] = [
  "preinstall",
  "install",
  "postinstall",
  "preinstall:ci",
  "install:ci",
  "postinstall:ci",
];

/**
 * Component which manages the project specific NX Config and is added to all NXMonorepo subprojects.
 * @experimental
 */
export class NxProject extends Component {
  /**
   * Retrieves an instance of NXProject if one is associated to the given project.
   *
   * @param project project instance.
   */
  static of(project: Project): NxProject | undefined {
    return project.components.find((c) =>
      ProjectUtils.isNamedInstanceOf(c, NxProject)
    ) as NxProject | undefined;
  }
  /**
   * Retrieves an instance of NXProject if one is associated to the given project,
   * otherwise created a NXProject instance for the project.
   *
   * @param project project instance.
   */
  static ensure(project: Project): NxProject {
    return NxProject.of(project) || new NxProject(project);
  }

  /**
   * Raw json file
   *
   * **Attention:** any overrides applied here will not be visible
   * in the properties and only included in final synthesized output,
   * and likely to override native handling.
   * @advanced
   */
  public readonly file: JsonFile;

  /**
   * Named inputs
   * @see https://nx.dev/reference/nx-json#inputs-&-namedinputs
   */
  public namedInputs: Obj<any> = {};
  /**
   * Targets configuration
   * @see https://nx.dev/reference/project-configuration
   */
  public targets: Obj<any> = {};
  /**
   * Project tag annotations
   *
   * @see https://nx.dev/reference/project-configuration#tags
   */
  public tags: string[] = [];
  /**
   * Implicit dependencies
   *
   * @see https://nx.dev/reference/project-configuration#implicitdependencies
   */
  public implicitDependencies: string[] = [];
  /**
   * Explicit list of scripts for Nx to include.
   * @see https://nx.dev/reference/project-configuration#ignoring-package.json-scripts
   */
  public includedScripts: string[] = [];

  constructor(project: Project) {
    // Make sure we only ever have 1 instance of NxProject component per project
    if (NxProject.of(project))
      throw new Error(
        `Project ${project.name} already has associated NxProject component.`
      );

    const _existingFile = project.tryFindObjectFile("project.json");
    if (
      _existingFile &&
      !ProjectUtils.isNamedInstanceOf(_existingFile, JsonFile)
    ) {
      throw new Error(
        `Project "${project.name}" contains a "project.json" file that is not a JsonFile instance. NxProject is unable to support this project.`
      );
    }

    super(project);

    const _obj: Record<keyof Nx.ProjectConfig, () => any> = {
      name: () => this.project.name,
      root: () =>
        path
          .relative(this.project.root.outdir, this.project.outdir)
          .split(path.sep)
          .join("/"),
      namedInputs: () => asUndefinedIfEmpty(this.namedInputs),
      targets: () => asUndefinedIfEmpty(this.targets),
      tags: () => asUndefinedIfEmpty(this.tags),
      implicitDependencies: () => asUndefinedIfEmpty(this.implicitDependencies),
      includedScripts: () => asUndefinedIfEmpty(this.includedScripts),
    };

    this.file =
      (_existingFile as JsonFile) ||
      new JsonFile(project, "project.json", {
        readonly: true,
        marker: true,
        obj: _obj,
      });

    if (_existingFile) {
      project.logger.warn(
        `[NxProject] Project "${
          project.name
        }" defined independent project.json file, which might conflict with NxProject managed properties [${Object.keys(
          _obj
        ).join(",")}]`
      );
      Object.entries(_obj).forEach(([key, value]) => {
        _existingFile.addOverride(key, value);
      });
    }

    if (NxWorkspace.of(project)?.autoInferProjectTargets) {
      this.inferTargets();
    }
  }

  /**
   * Automatically infer targets based on project type.
   * @experimental
   */
  public inferTargets(): void {
    const _inferredBuildTarget = inferBuildTarget(this.project);
    if (_inferredBuildTarget) {
      this.targets.build = _inferredBuildTarget;
    }
  }

  /** Merge configuration into existing config */
  public merge(config: Nx.ProjectConfig): void {
    Object.entries(config).forEach(([key, value]) => {
      switch (key) {
        case "tags": {
          this.addTag(...value);
          break;
        }
        case "implicitDependencies": {
          this.addImplicitDependency(...value);
          break;
        }
        case "namedInputs": {
          Object.entries(value).forEach(([_key, _value]) => {
            this.setNamedInput(_key, _value as string[]);
          });
          break;
        }
        case "targets": {
          Object.entries(value).forEach(([_key, _value]) => {
            this.setTarget(_key, _value as any, true);
          });
          break;
        }
        default: {
          this.file.addOverride(key, value);
        }
      }
    });
  }

  /** Add tag */
  public addTag(...tags: string[]): void {
    this.tags.push(...tags);
  }

  /**
   * Adds an implicit dependency between the dependant (this project) and dependee.
   *
   * @param dependee project to add the implicit dependency on.
   */
  public addImplicitDependency(...dependee: (Project | string)[]) {
    this.implicitDependencies.push(
      ...dependee.map((_d) => (typeof _d === "string" ? _d : _d.name))
    );
  }

  /**
   * Adds a dependency between two Java Projects in the monorepo.
   * @param dependee project you wish to depend on
   */
  public addJavaDependency(dependee: JavaProject) {
    if (!(this.project instanceof JavaProject)) {
      throw Error(
        "Cannot call addJavaDependency on a project that is not a JavaProject"
      );
    }
    // Add implicit dependency for build order
    this.addImplicitDependency(dependee);

    // Add dependency in pom.xml
    this.project.addDependency(
      `${dependee.pom.groupId}/${dependee.pom.artifactId}@${dependee.pom.version}`
    );

    // Add a repository so that the dependency in the pom can be resolved
    this.project.pom.addRepository({
      id: dependee.name,
      url: `file://${path.join(
        path.relative(this.project.outdir, dependee.outdir),
        dependee.packaging.distdir
      )}`,
    });
  }

  /**
   * Adds a dependency between two Python Projects in the monorepo. The dependent must have Poetry enabled.
   * @param dependee project you wish to depend on
   * @throws error if the dependent does not have Poetry enabled
   */
  public addPythonPoetryDependency(dependee: PythonProject) {
    // Check we're adding the dependency to a poetry python project
    if (
      !(this.project instanceof PythonProject) ||
      !ProjectUtils.isNamedInstanceOf(this.project.depsManager as any, Poetry)
    ) {
      throw new Error(
        `${this.project.name} must be a PythonProject with Poetry enabled to add this dependency`
      );
    }

    // Add implicit dependency for build order
    this.addImplicitDependency(dependee);

    // Add local path dependency
    this.project.addDependency(
      `${dependee.name}@{path="${path.relative(
        this.project.outdir,
        dependee.outdir
      )}", develop=true}`
    );
  }

  /** Set `namedInputs` helper */
  public setNamedInput(name: string, inputs: string[]): void {
    this.namedInputs[name] = inputs;
  }

  /** @internal */
  protected _getTargetDefaults(name: string): Nx.IProjectTarget | {} {
    return NxWorkspace.of(this.project)?.targetDefaults[name] || {};
  }

  /** Set `targets` helper */
  public setTarget(
    name: string,
    target: Nx.IProjectTarget,
    includeDefaults: boolean | string = false
  ): void {
    let _default = {};
    if (includeDefaults) {
      if (this.targets[name]) {
        _default = this.targets[name];
      } else {
        (_default = this._getTargetDefaults(
          includeDefaults === true ? name : includeDefaults
        )),
          this.targets[name] || {};
      }
    }
    const mergedTarget: Nx.IProjectTarget = deepMerge([_default, target], {
      append: true,
    });
    this.targets[name] = {
      ...mergedTarget,
      outputs: mergedTarget.outputs
        ? [...new Set(mergedTarget.outputs)]
        : undefined,
    };
  }

  /**
   * Add input and output files to build target
   * @param inputs Input files
   * @param outputs Output files
   */
  public addBuildTargetFiles(
    inputs?: (string | Nx.IInput)[],
    outputs?: string[]
  ): void {
    this.setTarget(
      "build",
      {
        inputs: inputs || [],
        outputs: outputs || [],
      },
      true
    );
  }

  /** @interface */
  synthesize() {
    const projectPath = path
      .relative(this.project.root.outdir, this.project.outdir)
      .split(path.sep)
      .join("/");

    const isNodeProject = NodePackageUtils.isNodeProject(this.project);

    const packageManager =
      NodePackageUtils.tryFindNodePackage(this.project, true)?.packageManager ||
      NodePackageManager.NPM;

    this.project.tasks.all
      .filter((task) => {
        if (
          this.includedScripts.length &&
          !this.includedScripts.includes(task.name)
        ) {
          // Exclude tasks that are not in explicit "includeScripts" when defined
          return false;
        }
        if (task.name in this.targets) {
          // always include tasks that were explicitly added to nx targets
          return true;
        }
        if (
          NODE_LIFECYCLE_TASKS.includes(task.name) &&
          NodePackageUtils.isNodeProject(this.project)
        ) {
          // exclude node lifecycle tasks for node based projects
          return false;
        }
        return true;
      })
      .forEach((task) => {
        // Non-NodeProject don't have package.json so exec bubbles to the root.
        const command = isNodeProject
          ? NodePackageUtils.command.projen(packageManager, task.name)
          : NodePackageUtils.command.downloadExec(
              packageManager,
              "projen",
              task.name
            );

        const _target = this.targets[task.name] || {};
        _target.executor = _target.executor || "nx:run-commands";
        _target.options = {
          command,
          cwd: projectPath,
          ..._target.options,
        };
        this.targets[task.name] = _target;
      });

    super.synthesize();
  }
}
