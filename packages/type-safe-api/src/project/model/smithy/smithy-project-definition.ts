/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component } from "projen";
import { SmithyBuild } from "projen/lib/smithy/smithy-build";
import { SmithyAwsPdkPrelude } from "./components/smithy-aws-pdk-prelude";
import { SmithyBuildGradleFile } from "./components/smithy-build-gradle-file";
import { SmithySettingsGradleFile } from "./components/smithy-settings-gradle-file";
import { DEFAULT_SMITHY_VERSION } from "./version";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../../codegen/components/utils";
import { Language } from "../../languages";
import { SmithyModelOptions } from "../../types";
import { TypeSafeApiModelProjectBase } from "../type-safe-api-model-project-base";

/**
 * Options for a smithy build project
 */
export interface SmithyProjectDefinitionOptions {
  /**
   * Smithy engine options
   */
  readonly smithyOptions: SmithyModelOptions;
  /**
   * The languages users have specified for handler projects (if any)
   */
  readonly handlerLanguages?: Language[];
}

/**
 * Creates a project which transforms a Smithy model to OpenAPI
 */
export class SmithyProjectDefinition extends Component {
  /**
   * Path to the generated OpenAPI specification, relative to the project outdir
   */
  public readonly openApiSpecificationPath: string;
  /**
   * Path to the json Smithy model, relative to the project outdir
   */
  public readonly smithyJsonModelPath: string;
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
  protected readonly modelDir: string;
  /**
   * Directory of generated model source code
   */
  protected readonly generatedModelDir: string;

  constructor(
    project: TypeSafeApiModelProjectBase,
    options: SmithyProjectDefinitionOptions
  ) {
    super(project);

    const { smithyOptions } = options;

    // Ignore gradle wrapper by default
    if (smithyOptions.ignoreGradleWrapper ?? true) {
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
      "software.amazon.smithy:smithy-openapi",
      "software.amazon.smithy:smithy-aws-traits",
    ];

    // Ensure dependencies always include the required dependencies, allowing users to customise the version
    const userSpecifiedDependencies =
      smithyOptions.smithyBuildOptions?.maven?.dependencies ?? [];
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
      dependencies,
      repositoryUrls: smithyOptions.smithyBuildOptions?.maven?.repositoryUrls,
    });

    const { namespace: serviceNamespace, serviceName } =
      smithyOptions.serviceName;

    // Create the smithy build json file
    this.smithyBuild = new SmithyBuild(project, {
      version: "2.0",
      ...smithyOptions.smithyBuildOptions,
      sources: [
        modelDir,
        ...this.asRelativePathsToProject(
          smithyOptions.smithyBuildOptions?.additionalSources ?? []
        ),
      ],
      projections: {
        ...smithyOptions.smithyBuildOptions?.projections,
        openapi: {
          ...smithyOptions.smithyBuildOptions?.projections?.openapi,
          plugins: {
            openapi: {
              service: `${serviceNamespace}#${serviceName}`,
              // By default, preserve tags in the generated spec, but allow users to explicitly overwrite this
              tags: true,
              // By default, use integer types as this is more intuitive when smithy distinguishes between Integers and Doubles.
              // Users may also override this.
              useIntegerType: true,
              ...smithyOptions.smithyBuildOptions?.projections?.openapi?.plugins
                ?.openapi,
            },
          },
        },
      },
      maven: {
        // Filter out any file dependencies since these aren't supported in smithy-build.json
        dependencies: dependencies.filter(
          (dep) => !dep.startsWith(SmithyBuildGradleFile.fileDependencyPrefix)
        ),
        repositories: (
          smithyOptions.smithyBuildOptions?.maven?.repositoryUrls ?? [
            "https://repo.maven.apache.org/maven2/",
            "file://~/.m2/repository",
          ]
        ).map((url) => ({ url })),
      },
    });

    // Add the smithy prelude (managed by aws-pdk)
    this.generatedModelDir = path.join("generated", "main", "smithy");
    new SmithyAwsPdkPrelude(project, {
      generatedModelDir: this.generatedModelDir,
      serviceNamespace,
      handlerLanguages: options.handlerLanguages,
    });
    this.addSources(this.generatedModelDir);

    const projectionOutputPath = path.join(
      "build",
      "smithyprojections",
      this.gradleProjectName,
      "openapi"
    );
    this.openApiSpecificationPath = path.join(
      projectionOutputPath,
      "openapi",
      `${serviceName}.openapi.json`
    );
    this.smithyJsonModelPath = path.join(
      projectionOutputPath,
      "model",
      "model.json"
    );

    // Copy the gradle files during build if they don't exist. We don't overwrite to allow users to BYO gradle wrapper
    // and set `ignoreGradleWrapper: false`.
    project.generateTask.exec(
      buildTypeSafeApiExecCommand(TypeSafeApiScript.COPY_GRADLE_WRAPPER)
    );

    // Build with gradle to generate smithy projections, and any other tasks
    project.generateTask.exec("./gradlew build");

    if (smithyOptions.ignoreSmithyBuildOutput ?? true) {
      // Ignore the build directory, and smithy-output which was the old build directory for the cli-based generation
      project.gitignore.addPatterns("build", "smithy-output");
    }
  }

  /**
   * Add maven-style or local file dependencies to the smithy model project
   * @param deps dependencies to add, eg "software.amazon.smithy:smithy-validation-model:1.27.2" or "file://../some/path/build/lib/my-shapes.jar
   */
  public addDeps(...deps: string[]) {
    this.smithyBuildGradleFile.addDeps(...deps);
    this.smithyBuild.addMavenDependencies(
      ...deps.filter(
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
