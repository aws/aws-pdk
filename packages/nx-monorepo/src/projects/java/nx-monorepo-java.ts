/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, Task, TaskRuntime } from "projen";
import { JavaProject, JavaProjectOptions } from "projen/lib/java";
import { PythonProject } from "projen/lib/python";
import {
  NxConfigurator,
  INxProjectCore,
} from "../../components/nx-configurator";
import { NxWorkspace } from "../../components/nx-workspace";
import { Nx } from "../../nx-types";

/**
 * Configuration options for the NxMonorepoJavaProject.
 */
export interface NxMonorepoJavaOptions extends JavaProjectOptions {
  readonly defaultReleaseBranch?: string;
}

/**
 * This project type will bootstrap a NX based monorepo with support for polygot
 * builds, build caching, dependency graph visualization and much more.
 *
 * @pjid nx-monorepo-java
 */
export class NxMonorepoJavaProject
  extends JavaProject
  implements INxProjectCore
{
  public readonly nxConfigurator: NxConfigurator;
  private readonly installTask: Task;

  constructor(options: NxMonorepoJavaOptions) {
    super({
      ...options,
      sample: false,
      junit: false,
    });

    this.addTestDependency("software.aws.awsprototypingsdk/nx-monorepo@^0");

    this.nxConfigurator = new NxConfigurator(this, {
      defaultReleaseBranch: options.defaultReleaseBranch,
    });

    // Setup maven nx plugin
    this.nx.plugins.push("@jnxplus/nx-maven");
    this.installTask = this.nxConfigurator.ensureNxInstallTask(
      "@jnxplus/nx-maven@^0.x"
    );

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

  /**
   * @inheritdoc
   */
  preSynthesize(): void {
    // Calling before super() to ensure proper pre-synth of NxProject component and its nested components
    this.nxConfigurator.preSynthesize();

    super.preSynthesize();
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
