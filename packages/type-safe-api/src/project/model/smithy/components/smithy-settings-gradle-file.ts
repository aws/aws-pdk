/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, FileBase, IResolver } from "projen";

/**
 * Options for the Smithy settings.gradle file
 */
export interface SmithySettingsGradleFileOptions {
  /**
   * Name of the gradle project
   */
  readonly gradleProjectName: string;
}

/**
 * Synthesize a settings.gradle file for Smithy projects
 */
export class SmithySettingsGradleFile extends FileBase {
  readonly options: SmithySettingsGradleFileOptions;

  constructor(project: Project, options: SmithySettingsGradleFileOptions) {
    super(project, "settings.gradle", {
      marker: true,
      readonly: true,
    });
    this.options = options;
  }

  public synthesizeContent(_: IResolver): string | undefined {
    return `// ${this.marker}
rootProject.name = '${this.options.gradleProjectName}'
`;
  }
}
