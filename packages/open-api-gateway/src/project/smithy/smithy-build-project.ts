/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, ProjectOptions, SampleFile } from "projen";
import { SmithyBuild } from "projen/lib/smithy/smithy-build";
import { SmithyGeneratedOutput } from "./components/smithy-generated-output";
import { SmithyBuildOptions } from "./types";

/**
 * Options for a smithy build project
 */
export interface SmithyBuildProjectOptions extends ProjectOptions {
  /**
   * Fully qualified service name
   */
  readonly fullyQualifiedServiceName: string;
  /**
   * Absolute path to the model directory
   */
  readonly modelPath: string;
  /**
   * Smithy build options
   */
  readonly smithyBuildOptions?: SmithyBuildOptions;
  /**
   * The build output directory, relative to the project outdir
   */
  readonly buildOutputDir: string;
  /**
   * Custom gradle wrapper path
   */
  readonly gradleWrapperPath?: string;
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

    // Add the gradle files which the user may modify to customise what's generated
    new SampleFile(this, "build.gradle", {
      sourcePath: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "smithy",
        "build.gradle"
      ),
    });
    new SampleFile(this, "settings.gradle", {
      sourcePath: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "smithy",
        "settings.gradle"
      ),
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
              service: options.fullyQualifiedServiceName,
              ...options.smithyBuildOptions?.projections?.openapi?.plugins
                ?.openapi,
            },
          },
        },
      },
    });

    // SmithyBuild component above always writes to smithy-build.json
    this.smithyBuildConfigPath = path.join(this.outdir, "smithy-build.json");
    this.smithyBuildOutputPath = path.join(this.outdir, options.buildOutputDir);

    new SmithyGeneratedOutput(this, {
      modelPath: options.modelPath,
      gradleProjectPath: this.outdir,
      smithyBuildConfigPath: this.smithyBuildConfigPath,
      outputPath: this.smithyBuildOutputPath,
      gradleWrapperPath: options.gradleWrapperPath,
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
