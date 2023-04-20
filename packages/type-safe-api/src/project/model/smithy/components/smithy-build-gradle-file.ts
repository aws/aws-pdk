/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, FileBase, IResolver } from "projen";

/**
 * Options for the Smithy build.gradle file
 */
export interface SmithyBuildGradleFileOptions {
  readonly modelDir: string;
  readonly dependencies: string[];
  readonly repositoryUrls?: string[];
}

/**
 * Synthesize a build.gradle file for Smithy projects
 */
export class SmithyBuildGradleFile extends FileBase {
  public static readonly fileDependencyPrefix: string = "file://";

  private readonly modelDir: string;
  private readonly dependencies: string[];
  private readonly repositories: string[];

  constructor(project: Project, options: SmithyBuildGradleFileOptions) {
    super(project, "build.gradle", {
      marker: true,
      readonly: true,
    });
    this.modelDir = options.modelDir;
    this.dependencies = options.dependencies;
    this.repositories = options.repositoryUrls?.map(
      (url) => `maven { url "${url}" }`
    ) ?? ["mavenLocal()", "mavenCentral()"];
  }

  /**
   * Add dependencies to the build.gradle
   */
  public addDeps(...deps: string[]) {
    this.dependencies.push(...deps);
  }

  private renderDependency = (dep: string) => {
    if (dep.startsWith(SmithyBuildGradleFile.fileDependencyPrefix)) {
      return `files("${dep.substring(
        SmithyBuildGradleFile.fileDependencyPrefix.length
      )}")`;
    }
    return `"${dep}"`;
  };

  public synthesizeContent(_: IResolver): string | undefined {
    return `// ${this.marker}
plugins {
    id "software.amazon.smithy" version "0.6.0"
}

sourceSets {
    main {
        java {
            srcDirs = ['${this.modelDir}']
        }
    }
}

// Dependencies can be added by configuring smithyBuildOptions in your .projenrc file
repositories {
${this.repositories.map((repository) => `    ${repository}`).join("\n")}
}

// Dependencies can be added by configuring smithyBuildOptions in your .projenrc file
dependencies {
${this.dependencies
  .map((dep) => `    implementation ${this.renderDependency(dep)}`)
  .join("\n")}
}
`;
  }
}
