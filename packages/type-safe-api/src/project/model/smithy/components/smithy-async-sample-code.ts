/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, SampleDir } from "projen";

/**
 * Options for Smithy sample code
 */
export interface SmithyAsyncSampleCodeOptions {
  /**
   * Directory in which the smithy sample code should be written
   */
  readonly modelDir: string;
  /**
   * Service namespace
   */
  readonly serviceNamespace: string;
  /**
   * Service name
   */
  readonly serviceName: string;
  /**
   * Optional first handler project language (to add the @handler trait to the sample operation)
   */
  readonly firstHandlerLanguage?: string;
}

/**
 * Defines sample code for a Smithy async API
 */
export class SmithyAsyncSampleCode extends SampleDir {
  constructor(
    project: Project,
    {
      modelDir,
      serviceName,
      serviceNamespace,
      firstHandlerLanguage,
    }: SmithyAsyncSampleCodeOptions
  ) {
    super(project, modelDir, {
      files: {
        "main.smithy": `$version: "2"
namespace ${serviceNamespace}

/// A sample smithy websocket api
@websocketJson${
          firstHandlerLanguage
            ? `\n@connectHandler(language: "${firstHandlerLanguage}")\n@disconnectHandler(language: "${firstHandlerLanguage}")`
            : ""
        }
service ${serviceName} {
    version: "1.0"
    operations: [
      SubscribeToNotifications
      SendNotification
    ]
}`,
        "operations/subscribe-to-notifications.smithy": `$version: "2"
namespace ${serviceNamespace}

${firstHandlerLanguage ? `\n@handler(language: "${firstHandlerLanguage}")` : ""}
@async(direction: "client_to_server")
operation SubscribeToNotifications {
    input := {
        @required
        topic: String
    }
}
`,
        "operations/send-notification.smithy": `$version: "2"
namespace ${serviceNamespace}


@async(direction: "server_to_client")
operation SendNotification {
    input := {
        @required
        topic: String

        @required
        title: String

        @required
        message: String
    }
}
`,
      },
    });
  }
}
