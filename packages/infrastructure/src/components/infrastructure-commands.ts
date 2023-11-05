/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ProjectUtils } from "@aws/monorepo";
import { Component, Project } from "projen";

/**
 * Common commands for infrastructure projects
 */
export class InfrastructureCommands extends Component {
  /**
   * Retrieves an instance of InfrastructureCommands if one is associated to the given project
   * @param project project instance
   */
  static of(project: Project): InfrastructureCommands | undefined {
    return project.components.find((c) =>
      ProjectUtils.isNamedInstanceOf(c, InfrastructureCommands)
    ) as InfrastructureCommands | undefined;
  }

  /**
   * Retrieves an instance of InfrastructureCommands if one is associated to the given project,
   * otherwise creates an InfrastructureCommands instance for the project.
   * @param project project instance
   */
  static ensure(project: Project): InfrastructureCommands {
    return (
      InfrastructureCommands.of(project) || new InfrastructureCommands(project)
    );
  }

  constructor(project: Project) {
    super(project);

    // Add a development deployment task which uses hotswap for faster deployments
    // See: https://aws.amazon.com/blogs/developer/increasing-development-speed-with-cdk-watch/
    const deployDevTask = project.addTask("deploy:dev", {
      receiveArgs: true,
      description:
        "Performs a hotswap CDK deployment, useful for faster development cycles",
    });
    // --hotswap-fallback falls back to a regular deployment if there are resources which have
    // changed that cannot be hotswapped
    deployDevTask.exec(
      "cdk deploy --hotswap-fallback --require-approval never",
      {
        receiveArgs: true,
      }
    );
  }
}
