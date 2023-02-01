/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { getLogger } from "log4js";
import { Component } from "projen";
import { JavaProject } from "projen/lib/java";
import { invokeOpenApiGenerator } from "./utils";
import { ClientLanguage } from "../../languages";

const logger = getLogger();

/**
 * Configuration for the GeneratedJavaClient component
 */
export interface GeneratedJavaClientSourceCodeOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;

  /**
   * Control if generator needs to be invoked
   */
  readonly invokeGenerator: boolean;
}

/**
 * Generates the java client using OpenAPI Generator
 */
export class GeneratedJavaClientSourceCode extends Component {
  private options: GeneratedJavaClientSourceCodeOptions;

  constructor(
    project: JavaProject,
    options: GeneratedJavaClientSourceCodeOptions
  ) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    if (this.options.invokeGenerator) {
      const javaProject = this.project as JavaProject;
      const invokerPackage = `${javaProject.pom.groupId}.${javaProject.name}.client`;

      // Generate the java client
      logger.debug("Generating java client...");
      invokeOpenApiGenerator({
        generator: "java",
        specPath: this.options.specPath,
        outputPath: this.project.outdir,
        generatorDirectory: ClientLanguage.JAVA,
        additionalProperties: {
          useSingleRequestParameter: "true",
          groupId: javaProject.pom.groupId,
          artifactId: javaProject.pom.artifactId,
          artifactVersion: javaProject.pom.version,
          invokerPackage,
          apiPackage: `${invokerPackage}.api`,
          modelPackage: `${invokerPackage}.model`,
          hideGenerationTimestamp: "true",
          additionalModelTypeAnnotations: [
            "@lombok.AllArgsConstructor",
            // Regular lombok builder is not used since an abstract base schema class is also annotated
            "@lombok.experimental.SuperBuilder",
          ].join("\\ "),
        },
        srcDir: path.join("src", "main", "java", ...invokerPackage.split(".")),
      });
    }
  }
}
