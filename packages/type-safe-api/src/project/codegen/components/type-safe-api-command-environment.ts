/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjectUtils } from "@aws/monorepo";
import { Component, Project } from "projen";
import { TypeScriptProject } from "projen/lib/typescript";
import { getTypeSafeApiTaskEnvironment } from "./utils";

/**
 * Component for setting up the environemnt for type safe api commands
 */
export class TypeSafeApiCommandEnvironment extends Component {
  /**
   * Retrieves an instance of TypeSafeApiCommandEnvironment if one is associated to the given project.
   *
   * @param project project instance.
   */
  static of(project: Project): TypeSafeApiCommandEnvironment | undefined {
    return project.components.find((c) =>
      ProjectUtils.isNamedInstanceOf(c, TypeSafeApiCommandEnvironment)
    ) as TypeSafeApiCommandEnvironment | undefined;
  }

  /**
   * Retrieves an instance of TypeSafeApiCommandEnvironment if one is associated to the given project,
   * otherwise creates a TypeSafeApiCommandEnvironment instance for the project.
   *
   * @param project project instance.
   */
  static ensure(project: Project): TypeSafeApiCommandEnvironment {
    return (
      TypeSafeApiCommandEnvironment.of(project) ||
      new TypeSafeApiCommandEnvironment(project)
    );
  }

  constructor(project: Project) {
    super(project);

    // Add all environment variables to the task environment
    Object.entries(getTypeSafeApiTaskEnvironment()).forEach(([key, value]) =>
      project.tasks.addEnvironment(key, value)
    );

    // TypeScript projects need a dev dependency on PDK to ensure npx resolves to the correct pdk
    if (ProjectUtils.isNamedInstanceOf(project, TypeScriptProject)) {
      project.addDevDeps("@aws/pdk@^0");
    }
  }
}
