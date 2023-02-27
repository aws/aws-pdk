/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, ProjectOptions, SampleFile } from "projen";
import { SmithyBuild } from "projen/lib/smithy/smithy-build";
import { SampleExecutable } from "./components/sample-executable";
import { SmithyBuildGradleFile } from "./components/smithy-build-gradle-file";
import { SmithyGeneratedOutput } from "./components/smithy-generated-output";
import { SmithyBuildOptions } from "./types";
import { SmithyServiceName } from "../types";

/**
 * Options for a smithy build project
 */
export interface SmithyBuildProjectOptions extends ProjectOptions {
  /**
   * Smithy service name
   */
  readonly serviceName: SmithyServiceName;
  /**
   * Smithy build options
   */
  readonly smithyBuildOptions?: SmithyBuildOptions;
  /**
   * The build output directory, relative to the project outdir
   */
  readonly buildOutputDir: string;
}

/**
 * Creates a project which transforms a Smithy model to OpenAPI
 */
export class SmithyBuildProject extends Project {
  /**
   * Absolute path to the smithy-build.json file
   */
  public smithyBuildConfigPath: string;
  /**
   * Absolute path to the smithy build output
   */
  public smithyBuildOutputPath: string;

  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: SmithyBuildProjectOptions) {
    super(options);

    // HACK: remove all components but the ones we are registering - removes .gitignore, tasks, etc since these are
    // unused and a distraction for end-users!
    // @ts-ignore
    this._components = [];

    const samplePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "samples",
      "smithy"
    );

    // Add gradle wrapper files and executables
    [
      "gradle/wrapper/gradle-wrapper.jar",
      "gradle/wrapper/gradle-wrapper.properties",
    ].forEach((file) => {
      new SampleFile(this, file, {
        sourcePath: path.join(samplePath, file),
      });
    });

    ["gradlew", "gradlew.bat"].forEach((executable) => {
      new SampleExecutable(this, executable, {
        sourcePath: path.join(samplePath, executable),
      });
    });

    // Add settings.gradle
    new SampleFile(this, "settings.gradle", {
      contents: `rootProject.name = '${this.name.replace(
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
      options.smithyBuildOptions?.maven?.dependencies ?? [];
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
    new SmithyBuildGradleFile(this, {
      modelDir,
      dependencies,
      repositoryUrls: options.smithyBuildOptions?.maven?.repositoryUrls,
    });

    const { namespace: serviceNamespace, serviceName } = options.serviceName;

    // Create the default smithy model
    new SampleFile(this, path.join(modelDir, "main.smithy"), {
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
    new SmithyBuild(this, {
      version: "2.0",
      ...options.smithyBuildOptions,
      projections: {
        ...options.smithyBuildOptions?.projections,
        openapi: {
          plugins: {
            openapi: {
              service: `${serviceNamespace}#${serviceName}`,
              // By default, preserve tags in the generated spec, but allow users to explicitly overwrite this
              tags: true,
              ...options.smithyBuildOptions?.projections?.openapi?.plugins
                ?.openapi,
            },
          },
        },
      },
      maven: {
        dependencies,
        repositories: (
          options.smithyBuildOptions?.maven?.repositoryUrls ?? [
            "https://repo.maven.apache.org/maven2/",
            "file://~/.m2/repository",
          ]
        ).map((url) => ({ url })),
      },
    });

    // SmithyBuild component above always writes to smithy-build.json
    this.smithyBuildConfigPath = path.join(this.outdir, "smithy-build.json");
    this.smithyBuildOutputPath = path.join(this.outdir, options.buildOutputDir);

    new SmithyGeneratedOutput(this, {
      modelPath: path.join(this.outdir, modelDir),
      gradleProjectPath: this.outdir,
      smithyBuildConfigPath: this.smithyBuildConfigPath,
      outputPath: this.smithyBuildOutputPath,
    });
  }

  /**
   * @inheritDoc
   */
  synth() {
    // Save some time by only synthesizing once. We synthesize this project early so that it's available for the parent
    // project's install phase (pre-synth). Projen will call this method again at the usual time to synthesize this,
    // project, at which point we're already done so can skip.
    if (this.synthed) {
      return;
    }
    super.synth();
    this.synthed = true;
  }
}
