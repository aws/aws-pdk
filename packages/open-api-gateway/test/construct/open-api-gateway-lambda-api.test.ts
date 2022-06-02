/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

import { Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { AuthorizationType, Cors } from "aws-cdk-lib/aws-apigateway";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { OpenAPIV3 } from "openapi-types";
import { OpenApiGatewayLambdaApi } from "../../lib/construct";

const sampleSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    version: "1.0.0",
    title: "Test API",
  },
  paths: {
    "/test": {
      get: {
        operationId: "testOperation",
        responses: {
          200: {
            description: "Successful response",
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
        },
      },
    },
  },
};

const operationLookup = {
  testOperation: {
    method: "get",
    path: "/test",
  },
};

describe("OpenAPI Gateway Lambda Api Construct Unit Tests", () => {
  it("Synth", () => {
    const stack = new Stack();
    new OpenApiGatewayLambdaApi(stack, "ApiTest", {
      spec: sampleSpec,
      operationLookup,
      integrations: {
        testOperation: {
          function: new Function(stack, "Lambda", {
            code: Code.fromInline("code"),
            handler: "handler",
            runtime: Runtime.NODEJS_16_X,
          }),
        },
      },
    });
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });

  it("With IAM Auth and CORS", () => {
    const stack = new Stack();
    new OpenApiGatewayLambdaApi(stack, "ApiTest", {
      authType: AuthorizationType.IAM,
      corsOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowCredentials: true,
        statusCode: 200,
      },
      spec: sampleSpec,
      operationLookup,
      integrations: {
        testOperation: {
          function: new Function(stack, "Lambda", {
            code: Code.fromInline("code"),
            handler: "handler",
            runtime: Runtime.NODEJS_16_X,
          }),
        },
      },
    });
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });

  it("Should Throw When Integration Missing", () => {
    const stack = new Stack();
    expect(
      () =>
        new OpenApiGatewayLambdaApi(stack, "ApiTest", {
          spec: sampleSpec,
          operationLookup,
          integrations: {},
        })
    ).toThrow(
      "Missing required integration for operation testOperation (get /test)"
    );
  });
});
