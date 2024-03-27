/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { OpenAPIV3 } from "openapi-types";
import { extractWebSocketSchemas } from "../../../src/construct/prepare-spec-event-handler/websocket-schema";

const SIMPLE_SPEC: OpenAPIV3.Document = {
  openapi: "3.0.2",
  info: {
    title: "MyService",
    version: "1.0",
    description: "A sample smithy websocket api",
  },
  paths: {
    "/SendNotification": {
      post: {
        operationId: "SendNotification",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SendNotificationRequestContent",
              },
            },
          },
          required: true,
        },
        responses: {
          "200": {
            description: "SendNotification 200 response",
          },
        },
      },
    },
    "/SubscribeToNotifications": {
      post: {
        operationId: "SubscribeToNotifications",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SubscribeToNotificationsRequestContent",
              },
            },
          },
          required: true,
        },
        responses: {
          "200": {
            description: "SubscribeToNotifications 200 response",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Bar: {
        type: "object",
        properties: {
          blip: {
            type: "string",
          },
        },
      },
      Foo: {
        type: "object",
        properties: {
          baz: {
            type: "integer",
            format: "int32",
          },
          bart: {
            $ref: "#/components/schemas/Bar",
          },
        },
      },
      SendNotificationRequestContent: {
        type: "object",
        properties: {
          topic: {
            type: "string",
          },
          title: {
            type: "string",
          },
          message: {
            type: "string",
          },
        },
        required: ["message", "title", "topic"],
      },
      SubscribeToNotificationsRequestContent: {
        type: "object",
        properties: {
          topic: {
            type: "string",
          },
          foo: {
            $ref: "#/components/schemas/Foo",
          },
        },
        required: ["topic"],
      },
    },
  },
};

const RECURSIVE_SPEC: OpenAPIV3.Document = {
  openapi: "3.0.2",
  info: {
    title: "MyService",
    version: "1.0",
    description: "A sample smithy websocket api",
  },
  paths: {
    "/Recursive": {
      post: {
        operationId: "Recursive",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RecursiveRequestContent",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Recursive 200 response",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Node: {
        type: "object",
        properties: {
          value: {
            type: "string",
          },
          left: {
            $ref: "#/components/schemas/Node",
          },
          right: {
            $ref: "#/components/schemas/Node",
          },
        },
        required: ["value"],
      },
      RecursiveRequestContent: {
        type: "object",
        properties: {
          root: {
            $ref: "#/components/schemas/Node",
          },
        },
      },
    },
  },
};

describe("Extract WebSocketSchema", () => {
  it("extracts schemas from a simple spec", () => {
    expect(
      extractWebSocketSchemas(
        ["SendNotification", "SubscribeToNotifications"],
        {
          SendNotification: "/SendNotification",
          SubscribeToNotifications: "/SubscribeToNotifications",
        },
        SIMPLE_SPEC
      )
    ).toMatchSnapshot();
  });

  it("extracts schemas from a recursive spec", () => {
    expect(
      extractWebSocketSchemas(
        ["Recursive"],
        {
          Recursive: "/Recursive",
        },
        RECURSIVE_SPEC
      )
    ).toMatchSnapshot();
  });

  it("throws when multiple methods are defined for a path", () => {
    expect(() => {
      expect(
        extractWebSocketSchemas(
          ["SendNotification", "SubscribeToNotifications"],
          {
            SendNotification: "/SendNotification",
            SubscribeToNotifications: "/SubscribeToNotifications",
          },
          {
            ...SIMPLE_SPEC,
            paths: {
              ...SIMPLE_SPEC.paths,
              "/SendNotification": {
                get: {
                  ...SIMPLE_SPEC.paths["/SendNotification"]!.post!,
                },
                ...SIMPLE_SPEC.paths["/SendNotification"],
              },
            },
          }
        )
      ).toMatchSnapshot();
    }).toThrow(
      "Each path must have a single method for websocket apis. Found get, post"
    );
  });
});
