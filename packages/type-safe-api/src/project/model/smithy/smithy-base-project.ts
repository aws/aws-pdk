/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  MonorepoJavaProject,
  MonorepoPythonProject,
  MonorepoTsProject,
  NxProject,
  ProjectUtils,
} from "@aws/monorepo";
import { Project, ProjectOptions } from "projen";
import { SmithyProjectDefinition } from "./smithy-project-definition";

/**
 * Options for a Smithy project
 */
export interface SmithyBaseProjectOptions extends ProjectOptions {}

/**
 * Base project for Smithy projects
 */
export abstract class SmithyBaseProject extends Project {
  private readonly smithyDeps: SmithyBaseProject[] = [];

  constructor(options: SmithyBaseProjectOptions) {
    super(options);
  }

  /**
   * Returns the smithy project definition
   */
  public abstract smithyProjectDefinition(): SmithyProjectDefinition;

  /**
   * Add a dependency on other smithy projects
   */
  public addSmithyDeps(...deps: SmithyBaseProject[]) {
    this.smithyDeps.push(...deps);

    const allDeps = this.allSmithyDeps();

    // Add the smithy dependencies.
    // Smithy jars only include the models defined in that project, so we must add transitive dependencies explicitly
    this.smithyProjectDefinition().addSmithyDeps(
      ...allDeps.map((dep) => dep.smithyProjectDefinition())
    );

    // Add the monorepo implicit dependency if applicable
    const isNxWorkspace =
      this.parent &&
      (ProjectUtils.isNamedInstanceOf(this.parent, MonorepoTsProject) ||
        ProjectUtils.isNamedInstanceOf(this.parent, MonorepoJavaProject) ||
        ProjectUtils.isNamedInstanceOf(this.parent, MonorepoPythonProject));

    if (isNxWorkspace) {
      deps.forEach((dep) => NxProject.ensure(this).addImplicitDependency(dep));
    }
  }

  private allSmithyDeps(): SmithyBaseProject[] {
    return [
      ...this.smithyDeps,
      ...this.smithyDeps.flatMap((d) => d.allSmithyDeps()),
    ];
  }
}
