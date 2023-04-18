/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, SampleFile } from "projen";
import { SmithyBuild } from "projen/lib/smithy/smithy-build";
import { SampleExecutable } from "./components/sample-executable";
import { SmithyBuildGradleFile } from "./components/smithy-build-gradle-file";
import { SmithyModelOptions } from "../../types";
import { TypeSafeApiModelProject } from "../type-safe-api-model-project";

/**
 * Options for a smithy build project
 */
export interface SmithyDefinitionOptions {
  /**
   * Smithy engine options
   */
  readonly smithyOptions: SmithyModelOptions;

  /**
   * The build output directory, relative to the project outdir
   */
  readonly buildOutputDir: string;
}

/**
 * Creates a project which transforms a Smithy model to OpenAPI
 */
export class SmithyDefinition extends Component {
  public readonly openApiSpecificationPath: string;

  constructor(
    project: TypeSafeApiModelProject,
    options: SmithyDefinitionOptions
  ) {
    super(project);

    const { smithyOptions } = options;

    const samplePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "samples",
      "smithy"
    );

    const gradleExecutables = ["gradlew", "gradlew.bat"];
    const gradleFiles = [
      "gradle/wrapper/gradle-wrapper.jar",
      "gradle/wrapper/gradle-wrapper.properties",
    ];

    // Add gradle wrapper files and executables
    gradleFiles.forEach((file) => {
      new SampleFile(project, file, {
        sourcePath: path.join(samplePath, file),
      });
    });
    gradleExecutables.forEach((executable) => {
      new SampleExecutable(project, executable, {
        sourcePath: path.join(samplePath, executable),
      });
    });

    // Ignore gradle wrapper by default
    if (smithyOptions.ignoreGradleWrapper ?? true) {
      project.gitignore.addPatterns("gradle");
      project.gitignore.addPatterns("gradlew");
      project.gitignore.addPatterns("gradlew.bat");
    }
    // Always ignore the .gradle dir which the wrapper downloads gradle into
    project.gitignore.addPatterns(".gradle");

    // Add settings.gradle
    new SampleFile(project, "settings.gradle", {
      contents: `rootProject.name = '${project.name.replace(
        /[\/\\:<>"?\*|]/g,
        "-"
      )}'`,
    });

    const modelDir = "src/main/smithy";

    // Always add the following required dependencies
    const requiredDependencies = [
      "software.amazon.smithy:smithy-cli",
      "software.amazon.smithy:smithy-model",
      "software.amazon.smithy:smithy-openapi",
      "software.amazon.smithy:smithy-aws-traits",
    ];
    const requiredSmithyDependencyVersion = "1.28.0";

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
        .map((dep) => `${dep}:${requiredSmithyDependencyVersion}`),
      ...userSpecifiedDependencies,
    ];

    // Add build.gradle
    new SmithyBuildGradleFile(project, {
      modelDir,
      dependencies,
      repositoryUrls: smithyOptions.smithyBuildOptions?.maven?.repositoryUrls,
    });

    const { namespace: serviceNamespace, serviceName } =
      smithyOptions.serviceName;

    // Create the default smithy model
    new SampleFile(project, path.join(modelDir, "main.smithy"), {
      contents: `$version: "2"
namespace ${serviceNamespace}

use aws.protocols#restJson1

/// A sample smithy api
@restJson1
service ${serviceName} {
    version: "1.0"
    operations: [SayHello]
}

@readonly
@http(method: "GET", uri: "/hello")
operation SayHello {
    input: SayHelloInput
    output: SayHelloOutput
    errors: [ApiError]
}

string Name
string Message

@input
structure SayHelloInput {
    @httpQuery("name")
    @required
    name: Name
}

@output
structure SayHelloOutput {
    @required
    message: Message
}

@error("client")
structure ApiError {
    @required
    errorMessage: Message
}
`,
    });

    // Create the smithy build json file
    new SmithyBuild(project, {
      version: "2.0",
      ...smithyOptions.smithyBuildOptions,
      projections: {
        ...smithyOptions.smithyBuildOptions?.projections,
        openapi: {
          plugins: {
            openapi: {
              service: `${serviceNamespace}#${serviceName}`,
              // By default, preserve tags in the generated spec, but allow users to explicitly overwrite this
              tags: true,
              ...smithyOptions.smithyBuildOptions?.projections?.openapi?.plugins
                ?.openapi,
            },
          },
        },
      },
      maven: {
        dependencies,
        repositories: (
          smithyOptions.smithyBuildOptions?.maven?.repositoryUrls ?? [
            "https://repo.maven.apache.org/maven2/",
            "file://~/.m2/repository",
          ]
        ).map((url) => ({ url })),
      },
    });

    this.openApiSpecificationPath = path.join(
      options.buildOutputDir,
      "openapi",
      "openapi",
      `${serviceName}.openapi.json`
    );

    // Copy the gradle files during build if they don't exist. We don't overwrite to allow users to BYO gradle wrapper
    // and set `ignoreGradleWrapper: false`.
    project.generateTask.exec("mkdir -p gradle/wrapper");
    const samplePathRelativeToProjectOutdir = path.relative(
      project.outdir,
      path.resolve(samplePath)
    );
    [...gradleFiles, ...gradleExecutables].forEach((file) => {
      project.generateTask.exec(
        `if [ ! -f ${file} ]; then cp ${path.join(
          samplePathRelativeToProjectOutdir,
          file
        )} ${file}; fi`
      );
    });

    // SmithyBuild component above always writes to smithy-build.json
    project.generateTask.exec(
      `./gradlew -p . generate -Pconfig=smithy-build.json -Pdiscover=${modelDir} -Poutput=${options.buildOutputDir}`
    );

    if (smithyOptions.ignoreSmithyBuildOutput ?? true) {
      project.gitignore.addPatterns(options.buildOutputDir);
    }
  }
}
