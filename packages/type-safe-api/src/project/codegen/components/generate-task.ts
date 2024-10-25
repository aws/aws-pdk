/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjectUtils } from "@aws/monorepo";
import { Component, Project, Task } from "projen";

/**
 * Component which manages a "generate" task for a project
 */
export class GenerateTask extends Component {
  /**
   * Retrieves an instance of GenerateTask if one is associated to the given project.
   *
   * @param project project instance.
   */
  static of(project: Project): Task | undefined {
    return (
      project.components.find((c) =>
        ProjectUtils.isNamedInstanceOf(c, GenerateTask)
      ) as GenerateTask | undefined
    )?.task;
  }

  /**
   * Retrieves an instance of GenerateTask if one is associated to the given project,
   * otherwise creates a GenerateTask instance for the project.
   *
   * @param project project instance.
   */
  static ensure(project: Project): Task {
    return GenerateTask.of(project) || new GenerateTask(project).task;
  }

  public readonly task: Task;

  constructor(project: Project) {
    super(project);

    this.task =
      project.tasks.tryFind("generate") ?? project.addTask("generate");
  }
}
