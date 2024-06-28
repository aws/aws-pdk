/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsPrototypingChecks, PDKNag } from "@aws/pdk-nag";
import { Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { WebSocketIamAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import {
  WebSocketLambdaIntegration,
  WebSocketMockIntegration,
} from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
import { OpenAPIV3 } from "openapi-types";
import { withTempSpec } from "./utils";
import { TypeSafeWebsocketApi } from "../../src";

const testOperation: OpenAPIV3.OperationObject = {
  operationId: "testOperation",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
          },
        },
      },
    },
  },
  responses: {},
};

const sampleSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    version: "1.0.0",
    title: "Test API",
  },
  paths: {
    "/TestOperation": {
      post: testOperation,
    },
  },
};

const operationLookup = {
  testOperation: {
    path: "/TestOperation",
  },
};

describe("Type Safe WebSocket Api Construct Unit Tests", () => {
  it("Synthesizes", () => {
    const stack = new Stack(PDKNag.app());
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_LATEST,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new TypeSafeWebsocketApi(stack, "ApiTest", {
        authorizer: new WebSocketIamAuthorizer(),
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: new WebSocketLambdaIntegration("Integration", func),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it.each([
    ["AwsPrototypingChecks", new AwsPrototypingChecks()],
    ["AwsSolutionsChecks", new AwsSolutionsChecks()],
  ])("Has no nag errors for pack %s", (_name, nagPack) => {
    const app = PDKNag.app({ nagPacks: [nagPack], failOnError: true });
    const stack = new Stack(app);
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_LATEST,
    });
    NagSuppressions.addResourceSuppressions(
      func,
      [
        "AwsPrototyping-IAMNoManagedPolicies",
        "AwsPrototyping-IAMNoWildcardPermissions",
        "AwsPrototyping-LambdaLatestVersion",
        "AwsSolutions-IAM4",
        "AwsSolutions-IAM5",
        "AwsSolutions-L1",
      ].map((ruleId) => ({
        id: ruleId,
        reason: "This lambda function is not the resource under test",
      })),
      true
    );
    withTempSpec(sampleSpec, (specPath) => {
      new TypeSafeWebsocketApi(stack, "ApiTest", {
        authorizer: new WebSocketIamAuthorizer(),
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: new WebSocketLambdaIntegration("Integration", func),
          },
        },
      });
    });
    app.synth(); // Should not throw
  });

  it("Synthesizes With Connect and Disconnect", () => {
    const stack = new Stack(PDKNag.app());
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_LATEST,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new TypeSafeWebsocketApi(stack, "ApiTest", {
        authorizer: new WebSocketIamAuthorizer(),
        specPath,
        operationLookup,
        connect: {
          integration: new WebSocketLambdaIntegration("Connect", func),
        },
        disconnect: {
          integration: new WebSocketLambdaIntegration("Disconnect", func),
        },
        integrations: {
          testOperation: {
            integration: new WebSocketLambdaIntegration("Integration", func),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("Synthesizes With Mock Integrations", () => {
    const stack = new Stack(PDKNag.app());
    withTempSpec(sampleSpec, (specPath) => {
      new TypeSafeWebsocketApi(stack, "ApiTest", {
        authorizer: new WebSocketIamAuthorizer(),
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: new WebSocketMockIntegration("Mock"),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("Throws for missing integrations", () => {
    const stack = new Stack(PDKNag.app());
    withTempSpec(sampleSpec, (specPath) => {
      expect(() => {
        new TypeSafeWebsocketApi(stack, "ApiTest", {
          authorizer: new WebSocketIamAuthorizer(),
          specPath,
          operationLookup,
          integrations: {},
        });
      }).toThrow("Missing integrations for operations testOperation");
    });
  });

  it("Throws for missing operation lookup", () => {
    const stack = new Stack(PDKNag.app());
    withTempSpec(sampleSpec, (specPath) => {
      expect(() => {
        new TypeSafeWebsocketApi(stack, "ApiTest", {
          authorizer: new WebSocketIamAuthorizer(),
          specPath,
          operationLookup,
          integrations: {
            testOperation: {
              integration: new WebSocketMockIntegration("Mock"),
            },
            anotherOperation: {
              integration: new WebSocketMockIntegration("Missing"),
            },
          },
        });
      }).toThrow(
        "Integration not found in operation lookup for operation anotherOperation"
      );
    });
  });
});
