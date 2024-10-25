/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, SampleFile } from "projen";
import {
  OpenApiProjectDefinition,
  OpenApiProjectDefinitionOptions,
} from "./open-api-project-definition";

/**
 * Options for the OpenAPI Spec
 */
export interface OpenApiAsyncDefinitionOptions
  extends OpenApiProjectDefinitionOptions {}

/**
 * The OpenAPI Spec
 */
export class OpenApiAsyncDefinition extends OpenApiProjectDefinition {
  constructor(project: Project, options: OpenApiAsyncDefinitionOptions) {
    super(project, options);

    const firstHandlerLanguage = options.handlerLanguages?.[0];

    // Create a sample OpenAPI spec yaml if not defined
    new SampleFile(project, this.openApiSpecificationPath, {
      contents: `openapi: 3.0.3
info:
  version: 1.0.0
  title: ${options.openApiOptions.title}
paths:
  /SubscribeToNotifications:
    post:
      operationId: subscribeToNotifications${
        firstHandlerLanguage
          ? `
      x-handler:
        language: ${firstHandlerLanguage}`
          : ""
      }
      x-async:
        direction: client_to_server
        collection: notifications
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubscribeToNotificationsRequestContent'
      responses:
        200:
          description: Successful response
  /SendNotification:
    post:
      operationId: sendNotification${
        firstHandlerLanguage
          ? `
      x-handler:
        language: ${firstHandlerLanguage}`
          : ""
      }
      x-async:
        direction: server_to_client
        collection: notifications
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SendNotificationRequestContent'
      responses:
        200:
          description: Successful response
components:
  schemas:
    SubscribeToNotificationsRequestContent:
      type: object
      properties:
        topic:
          type: string
      required:
        - topic
    SendNotificationRequestContent:
      type: object
      properties:
        topic:
          type: string
        title:
          type: string
        message:
          type: string
      required:
        - topic
        - title
        - message
`,
    });
  }
}
