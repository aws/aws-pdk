/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { JsonFile } from "projen";
import { PythonProject, PythonProjectOptions } from "projen/lib/python";
import { GeneratedPythonClientSourceCode } from "./components/generated-python-client-source-code";
import { OpenApiGeneratorIgnoreFile } from "./components/open-api-generator-ignore-file";

/**
 * Configuration for the generated python client project
 */
export interface GeneratedPythonClientProjectOptions
  extends PythonProjectOptions {
  /**
   * The absolute path to the OpenAPI specification (spec.yaml) from which to generate code
   */
  readonly specPath: string;
  /**
   * Indicates whether the client generator needs to be invoked
   */
  readonly generateClient: boolean;
  /**
   * Whether or not to generate a lambda layer for this package
   */
  readonly generateLayer?: boolean;
}

/**
 * Python project containing a python client (and lambda handler wrappers) generated using OpenAPI Generator CLI
 */
export class GeneratedPythonClientProject extends PythonProject {
  /**
   * The directory in which the built layer is output
   */
  public layerDistDir: string = "dist/layer";

  // Store whether we've synthesized the project
  private synthed: boolean = false;

  constructor(options: GeneratedPythonClientProjectOptions) {
    super({
      sample: false,
      pytest: false,
      ...options,
    });

    // With pip and venv (default), it's useful to install our package into the shared venv to make
    // it easier for other packages in the monorepo to take dependencies on this package.
    if ((options.venv ?? true) && (options.pip ?? true)) {
      this.depsManager.installTask.exec("pip install --editable .");
    }

    // Package into a directory that can be used as a lambda layer. This is done as part of install since the end user
    // must control build order in the monorepo via explicit dependencies, and adding here means we can run as part of
    // initial project synthesis which ensures this is created regardless of whether the user has remembered to
    // configure build order.
    if (options.generateLayer) {
      const relativeLayerDir = path.join(".", this.layerDistDir, "python");
      this.depsManager.installTask.exec(`rm -rf ${relativeLayerDir}`);
      this.depsManager.installTask.exec(
        `pip install . --target ${relativeLayerDir}`
      );
    }

    // Use a package.json to ensure the client is discoverable by nx
    new JsonFile(this, "package.json", {
      obj: {
        name: this.name,
        __pdk__: true,
        version: options.version,
        scripts: Object.fromEntries(
          this.tasks.all.map((task) => [task.name, `npx projen ${task.name}`])
        ),
      },
      readonly: true,
    });

    new OpenApiGeneratorIgnoreFile(this);

    new GeneratedPythonClientSourceCode(this, {
      specPath: options.specPath,
      invokeGenerator: options.generateClient,
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
