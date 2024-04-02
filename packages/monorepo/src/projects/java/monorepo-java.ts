/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { DependencyType, Project, Task, TaskRuntime, TextFile } from "projen";
import { JavaProject } from "projen/lib/java";
import { PythonProject } from "projen/lib/python";
import { JavaProjectOptions } from "./java-project-options";
import {
  NxConfigurator,
  INxProjectCore,
} from "../../components/nx-configurator";
import { NxWorkspace } from "../../components/nx-workspace";
import {
  DEFAULT_PROJEN_VERSION,
  syncProjenVersions,
} from "../../components/projen-dependency";
import { Nx } from "../../nx-types";
import { ProjectUtils } from "../../utils";

const MVN_PLUGIN_PATH = "./.nx/plugins/nx_plugin.js";

/**
 * Configuration options for the NxMonorepoJavaProject.
 */
export interface MonorepoJavaOptions extends JavaProjectOptions {
  readonly defaultReleaseBranch?: string;

  /**
   * Whether to disable the generation of default licenses.
   *
   * @default false
   */
  readonly disableDefaultLicenses?: boolean;
}

/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid monorepo-java
 */
export class MonorepoJavaProject extends JavaProject implements INxProjectCore {
  public readonly nxConfigurator: NxConfigurator;
  private readonly installTask: Task;

  /**
   * Version of projen used by the monorepo and its subprojects
   */
  private readonly projenVersion: string;

  constructor(options: MonorepoJavaOptions) {
    // Pin default projen version for java
    const projenVersion =
      options.projenrcJavaOptions?.projenVersion ??
      DEFAULT_PROJEN_VERSION.replace(/^\^/, "");
    super({
      ...options,
      sample: false,
      junit: false,
      version: options.version ?? "0.0.0",
      groupId: options.groupId ?? "com.aws",
      artifactId: options.artifactId ?? "monorepo",
      projenrcJavaOptions: {
        ...options.projenrcJavaOptions,
        projenVersion,
      },
    });
    this.projenVersion = projenVersion;

    // Pin constructs version
    this.deps.removeDependency(
      "software.constructs/constructs",
      DependencyType.BUILD
    );
    this.addDependency("software.constructs/constructs@10.3.0");

    this.addTestDependency(`software.aws/pdk@${ProjectUtils.getPdkVersion()}`);

    this.nxConfigurator = new NxConfigurator(this, {
      defaultReleaseBranch: options.defaultReleaseBranch ?? "main",
      licenseOptions: options.disableDefaultLicenses
        ? {
            disableDefaultLicenses: options.disableDefaultLicenses,
          }
        : undefined,
    });

    // Setup maven nx plugin
    new TextFile(this, MVN_PLUGIN_PATH, {
      readonly: true,
      lines: fs
        .readFileSync(path.join(__dirname, "plugin/mvn_plugin.js"))
        .toString("utf-8")
        .split("\n"),
    });
    this.nx.plugins.push("@jnxplus/nx-maven", MVN_PLUGIN_PATH);
    this.installTask = this.nxConfigurator.ensureNxInstallTask({
      "@jnxplus/nx-maven": "^0.x",
    });

    // Map tasks to nx run-many
    this.nxConfigurator._overrideNxBuildTask(
      this.buildTask,
      { target: "build" },
      { force: true }
    );

    this.nxConfigurator._overrideNxBuildTask(this.preCompileTask, {
      target: "pre-compile",
    });

    this.nxConfigurator._overrideNxBuildTask(this.compileTask, {
      target: "compile",
    });

    this.nxConfigurator._overrideNxBuildTask(this.postCompileTask, {
      target: "post-compile",
    });

    this.nxConfigurator._overrideNxBuildTask(this.testTask, {
      target: "test",
    });

    this.nxConfigurator._overrideNxBuildTask(this.packageTask, {
      target: "package",
    });
  }

  /**
   * @inheritdoc
   */
  public get nx(): NxWorkspace {
    return this.nxConfigurator.nx;
  }

  /**
   * @inheritdoc
   */
  public execNxRunManyCommand(options: Nx.RunManyOptions): string {
    return this.nxConfigurator.execNxRunManyCommand(options);
  }

  /**
   * @inheritdoc
   */
  public composeNxRunManyCommand(options: Nx.RunManyOptions): string[] {
    return this.nxConfigurator.composeNxRunManyCommand(options);
  }

  /**
   * @inheritdoc
   */
  public addNxRunManyTask(name: string, options: Nx.RunManyOptions): Task {
    return this.nxConfigurator.addNxRunManyTask(name, options);
  }

  /**
   * @inheritdoc
   */
  public addImplicitDependency(
    dependent: Project,
    dependee: string | Project
  ): void {
    this.nxConfigurator.addImplicitDependency(dependent, dependee);
  }

  /**
   * @inheritdoc
   */
  public addJavaDependency(
    dependent: JavaProject,
    dependee: JavaProject
  ): void {
    this.nxConfigurator.addJavaDependency(dependent, dependee);
  }

  /**
   * @inheritdoc
   */
  public addPythonPoetryDependency(
    dependent: PythonProject,
    dependee: PythonProject
  ): void {
    this.nxConfigurator.addPythonPoetryDependency(dependent, dependee);
  }

  private addUpgradeDepsTask() {
    const upgradeDepsTask = new Task("upgrade-deps", {
      description: "Upgrade dependencies in the monorepo",
    });
    this.nxConfigurator._overrideNxBuildTask(upgradeDepsTask, {
      target: "upgrade",
    });
    this.nxConfigurator._configurePythonSubprojectUpgradeDeps(
      this,
      upgradeDepsTask
    );
  }

  /**
   * @inheritdoc
   */
  preSynthesize(): void {
    // Calling before super() to ensure proper pre-synth of NxProject component and its nested components
    this.nxConfigurator.preSynthesize();

    this.addUpgradeDepsTask();

    super.preSynthesize();

    syncProjenVersions(this.subprojects, this.projenVersion);
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.nxConfigurator.synth();
    super.synth();
  }

  postSynthesize(): void {
    super.postSynthesize();

    this.installNx();
  }

  /**
   * Run the install task which will install nx locally
   */
  private installNx(): void {
    this.logger.info("Installing dependencies...");
    const runtime = new TaskRuntime(this.outdir);
    runtime.runTask(this.installTask.name);
  }
}
