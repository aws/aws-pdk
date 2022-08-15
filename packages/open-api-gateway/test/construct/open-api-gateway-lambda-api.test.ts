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

import * as fs from "fs";
import * as path from "path";
import { PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Cors } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { NagSuppressions } from "cdk-nag";
import { OpenAPIV3 } from "openapi-types";
import { MethodAndPath, OpenApiGatewayLambdaApi } from "../../src/construct";
import { Authorizers } from "../../src/construct/authorizers";
import { CustomAuthorizerType } from "../../src/construct/authorizers/authorizers";

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
  testOperation: <MethodAndPath>{
    method: "get",
    path: "/test",
  },
};

const multiOperationSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    version: "1.0.0",
    title: "Test API",
  },
  paths: {
    "/test": Object.fromEntries(
      ["get", "put", "post", "delete"].map((method) => [
        method,
        {
          operationId: `${method}Operation`,
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
      ])
    ),
  },
};

const multiOperationLookup = Object.fromEntries(
  ["get", "put", "post", "delete"].map((method) => [
    `${method}Operation`,
    {
      method,
      path: "/test",
    },
  ])
);

const withTempSpec = <T>(
  spec: OpenAPIV3.Document,
  fn: (specPath: string) => T
): T => {
  const dir = fs.mkdtempSync("spec");
  try {
    const specPath = path.join(dir, "spec.json");
    fs.writeFileSync(specPath, JSON.stringify(spec));
    return fn(specPath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

describe("OpenAPI Gateway Lambda Api Construct Unit Tests", () => {
  it("Synth", () => {
    const stack = new Stack(PDKNag.app());
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayLambdaApi(stack, "ApiTest", {
        spec: sampleSpec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            function: func,
          },
        },
      });
      NagSuppressions.addResourceSuppressions(
        func,
        [
          {
            id: "AwsSolutions-IAM4",
            reason: "This is a test construct.",
          },
        ],
        true
      );
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("With IAM Auth and CORS", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayLambdaApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.iam(),
        corsOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: Cors.ALL_METHODS,
          allowCredentials: true,
          statusCode: 200,
        },
        spec: sampleSpec,
        specPath,
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
  });

  it("With Cognito Auth", () => {
    const stack = new Stack();

    const authorizer = Authorizers.cognito({
      authorizerId: "myCognitoAuthorizer",
      userPools: [new UserPool(stack, "pool")],
    });

    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayLambdaApi(stack, "ApiTest", {
        defaultAuthorizer: authorizer,
        spec: sampleSpec,
        specPath,
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
  });

  it("With Custom Auth", () => {
    const stack = new Stack();

    const authorizer = Authorizers.custom({
      authorizerId: "myCustomAuthorizer",
      function: new Function(stack, "Authorizer", {
        code: Code.fromInline("code"),
        handler: "handler",
        runtime: Runtime.NODEJS_16_X,
      }),
    });

    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayLambdaApi(stack, "ApiTest", {
        defaultAuthorizer: authorizer,
        spec: sampleSpec,
        specPath,
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
  });

  it("With Mixed Auth", () => {
    const stack = new Stack();

    const lambdaIntegration = new Function(stack, "LambdaIntegration", {
      code: Code.fromInline("integration"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });

    const lambdaAuthorizer = new Function(stack, "LambdaAuthorizer", {
      code: Code.fromInline("auth"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });

    // Request type custom authorizer
    const customAuthorizer = Authorizers.custom({
      authorizerId: "myCustomAuthorizer",
      function: lambdaAuthorizer,
      authorizerResultTtlInSeconds: 60,
      identitySource: "method.request.querystring.QueryString1",
      type: CustomAuthorizerType.REQUEST,
    });

    const cognitoAuthorizer = Authorizers.cognito({
      authorizerId: "myCognitoAuthorizer",
      userPools: [new UserPool(stack, "pool")],
      authorizationScopes: ["foo/bar"],
    });

    withTempSpec(multiOperationSpec, (specPath) => {
      new OpenApiGatewayLambdaApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.iam(),
        spec: multiOperationSpec,
        specPath,
        operationLookup: multiOperationLookup as any,
        integrations: {
          getOperation: {
            function: lambdaIntegration,
            authorizer: cognitoAuthorizer,
          },
          putOperation: {
            function: lambdaIntegration,
            authorizer: cognitoAuthorizer.withScopes("other/scope"),
          },
          postOperation: {
            function: lambdaIntegration,
            authorizer: customAuthorizer,
          },
          deleteOperation: {
            function: lambdaIntegration,
            // authorizer not specified default should be used
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("Should Throw When Integration Missing", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      expect(
        () =>
          new OpenApiGatewayLambdaApi(stack, "ApiTest", {
            spec: sampleSpec,
            specPath,
            operationLookup,
            integrations: {},
          })
      ).toThrow(
        "Missing required integration for operation testOperation (get /test)"
      );
    });
  });

  it("Should Throw When Token Authorizer Does Not Use Single Header", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      expect(
        () =>
          new OpenApiGatewayLambdaApi(stack, "ApiTest", {
            defaultAuthorizer: Authorizers.custom({
              authorizerId: "auth",
              function: new Function(stack, "LambdaAuthorizer", {
                code: Code.fromInline("auth"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              }),
              // Query param, not a header
              identitySource: "method.request.querystring.QueryString1",
            }),
            spec: sampleSpec,
            specPath,
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
          })
      ).toThrow(
        "identitySource must be a single header for a token authorizer, eg method.request.header.Authorization"
      );
    });
  });
});
