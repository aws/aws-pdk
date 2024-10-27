/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, Project } from "projen";
import { SmithyBuild } from "projen/lib/smithy/smithy-build";
import { SmithyBuildGradleFile } from "./components/smithy-build-gradle-file";
import { SmithySettingsGradleFile } from "./components/smithy-settings-gradle-file";
import { SmithyBuildOptions } from "./types";
import { DEFAULT_SMITHY_VERSION } from "./version";
import { GenerateTask } from "../../codegen/components/generate-task";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../../codegen/components/utils";

/**
 * Options for a smithy project definition
 */
export interface SmithyProjectDefinitionOptions {
  /**
   * Smithy build options
   */
  readonly smithyBuildOptions?: SmithyBuildOptions;
  /**
   * Set to false if you would like to check in your smithy build output or have more fine-grained control over what is
   * checked in, eg if you add other projections to the smithy-build.json file.
   * @default true
   */
  readonly ignoreSmithyBuildOutput?: boolean;
  /**
   * Set to false if you would like to check in your gradle wrapper. Do so if you would like to use a different version
   * of gradle to the one provided by default
   * @default true
   */
  readonly ignoreGradleWrapper?: boolean;
}

/**
 * Definition for a Smithy project
 */
export class SmithyProjectDefinition extends Component {
  /**
   * Name of the gradle project
   */
  public readonly gradleProjectName: string;

  /**
   * Reference to the build.gradle file component
   * @private
   */
  private readonly smithyBuildGradleFile: SmithyBuildGradleFile;
  /**
   * Reference to the smithy-build.json file component
   */
  private readonly smithyBuild: SmithyBuild;
  /**
   * Directory of model source code
   */
  public readonly modelDir: string;
  /**
   * Set of dependencies used to avoid adding duplicates
   */
  private readonly dependencySet: Set<string> = new Set();

  constructor(project: Project, options: SmithyProjectDefinitionOptions) {
    super(project);

    // Ignore gradle wrapper by default
    if (options.ignoreGradleWrapper ?? true) {
      project.gitignore.addPatterns("gradle");
      project.gitignore.addPatterns("gradlew");
      project.gitignore.addPatterns("gradlew.bat");
    }
    // Always ignore the .gradle dir which the wrapper downloads gradle into
    project.gitignore.addPatterns(".gradle");

    this.gradleProjectName = project.name.replace(/[\/\\:<>"?\*|]/g, "-");

    // Add settings.gradle
    new SmithySettingsGradleFile(project, {
      gradleProjectName: this.gradleProjectName,
    });

    const modelDir = "src/main/smithy";
    this.modelDir = modelDir;

    // Always add the following required dependencies
    const requiredDependencies = [
      "software.amazon.smithy:smithy-cli",
      "software.amazon.smithy:smithy-model",
    ];

    // Ensure dependencies always include the required dependencies, allowing users to customise the version
    const userSpecifiedDependencies =
      options.smithyBuildOptions?.maven?.dependencies ?? [];
    const userSpecifiedDependencySet = new Set(
      userSpecifiedDependencies.map((dep) =>
        dep.split(":").slice(0, -1).join(":")
      )
    );

    const dependencies = [
      ...requiredDependencies
        .filter((requiredDep) => !userSpecifiedDependencySet.has(requiredDep))
        .map((dep) => `${dep}:${DEFAULT_SMITHY_VERSION}`),
      ...userSpecifiedDependencies,
    ];

    // Add build.gradle
    this.smithyBuildGradleFile = new SmithyBuildGradleFile(project, {
      modelDir,
      dependencies: [],
      repositoryUrls: options.smithyBuildOptions?.maven?.repositoryUrls,
    });

    // Create the smithy build json file
    this.smithyBuild = new SmithyBuild(project, {
      version: "2.0",
      ...options.smithyBuildOptions,
      sources: [
        modelDir,
        ...this.asRelativePathsToProject(
          options.smithyBuildOptions?.additionalSources ?? []
        ),
      ],
      projections: {
        ...options.smithyBuildOptions?.projections,
      },
      maven: {
        dependencies: [],
        repositories: (
          options.smithyBuildOptions?.maven?.repositoryUrls ?? [
            "https://repo.maven.apache.org/maven2/",
            "file://~/.m2/repository",
          ]
        ).map((url) => ({ url })),
      },
    });

    this.addDeps(...dependencies);

    const generateTask = GenerateTask.ensure(project);

    // Copy the gradle files during build if they don't exist. We don't overwrite to allow users to BYO gradle wrapper
    // and set `ignoreGradleWrapper: false`.
    generateTask.exec(
      buildTypeSafeApiExecCommand(TypeSafeApiScript.COPY_GRADLE_WRAPPER)
    );

    // Build with gradle to generate smithy projections, and any other tasks
    generateTask.exec("./gradlew build");

    if (options.ignoreSmithyBuildOutput ?? true) {
      // Ignore the build directory, and smithy-output which was the old build directory for the cli-based generation
      project.gitignore.addPatterns("build", "smithy-output");
    }
  }

  /**
   * Add maven-style or local file dependencies to the smithy model project
   * @param deps dependencies to add, eg "software.amazon.smithy:smithy-validation-model:1.27.2" or "file://../some/path/build/lib/my-shapes.jar
   */
  public addDeps(...deps: string[]) {
    const depsToAdd = deps.filter((dep) => !this.dependencySet.has(dep));
    depsToAdd.forEach((dep) => this.dependencySet.add(dep));
    this.smithyBuildGradleFile.addDeps(...depsToAdd);
    this.smithyBuild.addMavenDependencies(
      ...depsToAdd.filter(
        (dep) => !dep.startsWith(SmithyBuildGradleFile.fileDependencyPrefix)
      )
    );
  }

  /**
   * Add dependencies on other smithy models, such that their shapes can be imported in this project
   * @param deps smithy definitions to depend on
   */
  public addSmithyDeps(...deps: SmithyProjectDefinition[]) {
    this.addDeps(
      ...deps.map(
        (dep) =>
          `${SmithyBuildGradleFile.fileDependencyPrefix}${path.join(
            path.relative(this.project.outdir, dep.project.outdir),
            "build",
            "libs",
            `${dep.gradleProjectName}.jar`
          )}`
      )
    );
  }

  /**
   * Add additional paths to model source files or directories.
   * Paths should be relative to the project outdir. Any absolute paths will be
   * resolved as relative paths.
   */
  public addSources(...sources: string[]) {
    const relativeSources = this.asRelativePathsToProject(sources);
    this.smithyBuild.addSources(...relativeSources);
    this.smithyBuildGradleFile.addSources(...relativeSources);
  }

  /**
   * Convert any given absolute paths to relative paths to the project outdir
   * @private
   */
  private asRelativePathsToProject(paths: string[]) {
    return paths.map((p) =>
      path.isAbsolute(p) ? path.relative(this.project.outdir, p) : p
    );
  }
}
