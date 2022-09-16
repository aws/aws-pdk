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
import { Integrations } from "../../lib";
import { MethodAndPath, OpenApiGatewayRestApi } from "../../src/construct";
import { Authorizers, Authorizer } from "../../src/construct/authorizers";
import { CustomAuthorizerType } from "../../src/construct/authorizers/authorizers";

const testOperation: OpenAPIV3.OperationObject = {
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
};

const sampleSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    version: "1.0.0",
    title: "Test API",
  },
  paths: {
    "/test": {
      get: testOperation,
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

describe("OpenAPI Gateway Rest Api Construct Unit Tests", () => {
  it("Synth", () => {
    const stack = new Stack(PDKNag.app());
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        spec: sampleSpec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
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

  it("With Path Parameters", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });

    const spec = {
      ...sampleSpec,
      paths: {
        "/test/{param1}/fixed/{param2}/{param3}": testOperation,
      },
    };

    withTempSpec(spec, (specPath) => {
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        spec,
        specPath,
        operationLookup: {
          testOperation: {
            path: "/test/{param1}/fixed/{param2}/{param3}",
            method: "get",
          },
        },
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
      });

      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("With IAM Auth and CORS", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayRestApi(stack, "ApiTest", {
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
            integration: Integrations.lambda(
              new Function(stack, "Lambda", {
                code: Code.fromInline("code"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              })
            ),
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
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        defaultAuthorizer: authorizer,
        spec: sampleSpec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(
              new Function(stack, "Lambda", {
                code: Code.fromInline("code"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              })
            ),
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
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        defaultAuthorizer: authorizer,
        spec: sampleSpec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(
              new Function(stack, "Lambda", {
                code: Code.fromInline("code"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              })
            ),
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
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.iam(),
        spec: multiOperationSpec,
        specPath,
        operationLookup: multiOperationLookup as any,
        integrations: {
          getOperation: {
            integration: Integrations.lambda(lambdaIntegration),
            authorizer: cognitoAuthorizer,
          },
          putOperation: {
            integration: Integrations.lambda(lambdaIntegration),
            authorizer: cognitoAuthorizer.withScopes("other/scope"),
          },
          postOperation: {
            integration: Integrations.lambda(lambdaIntegration),
            authorizer: customAuthorizer,
          },
          deleteOperation: {
            integration: Integrations.lambda(lambdaIntegration),
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
          new OpenApiGatewayRestApi(stack, "ApiTest", {
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
          new OpenApiGatewayRestApi(stack, "ApiTest", {
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
                integration: Integrations.lambda(
                  new Function(stack, "Lambda", {
                    code: Code.fromInline("code"),
                    handler: "handler",
                    runtime: Runtime.NODEJS_16_X,
                  })
                ),
              },
            },
          })
      ).toThrow(
        "identitySource must be a single header for a token authorizer, eg method.request.header.Authorization"
      );
    });
  });

  it("Without Waf", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        spec: sampleSpec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
        webAclOptions: {
          disable: true,
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("With Waf IP Set", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        spec: sampleSpec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
        webAclOptions: {
          cidrAllowList: {
            cidrType: "IPV4",
            cidrRanges: ["1.2.3.4/5"],
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("With Custom Managed Rules", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        spec: sampleSpec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
        webAclOptions: {
          managedRules: [
            { vendor: "AWS", name: "AWSManagedRulesAmazonIpReputationList" },
            { vendor: "AWS", name: "AWSManagedRulesAnonymousIpList" },
          ],
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("Permits Matching No Authorizers In Spec And Construct", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const spec = {
      ...sampleSpec,
      security: undefined,
    };
    withTempSpec(spec, (specPath) => {
      new OpenApiGatewayRestApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.none(),
        spec,
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  interface AuthorizerMismatchTestCase {
    readonly expectedErrorMessage: string;
    readonly specSecurityRequirements: OpenAPIV3.SecurityRequirementObject[];
    readonly constructAuthorizer: Authorizer;
  }

  const authorizerMismatchTestCases = (
    operation: string
  ): AuthorizerMismatchTestCase[] => [
    {
      specSecurityRequirements: [
        {
          "different-default-authorizer": [],
        },
      ],
      constructAuthorizer: Authorizers.iam(),
      expectedErrorMessage: `${operation} authorizer different-default-authorizer defined in the OpenAPI Spec or Smithy Model would be overridden by construct authorizer ${
        Authorizers.iam().authorizerId
      }`,
    },
    {
      specSecurityRequirements: [
        {
          "my-custom": ["scope1", "scope2"],
        },
      ],
      constructAuthorizer: Authorizers.cognito({
        authorizerId: "my-custom",
        userPools: [],
        authorizationScopes: ["scope1"],
      }),
      expectedErrorMessage: `${operation} authorizer scopes scope1, scope2 defined in the OpenAPI Spec or Smithy Model differ from those in the construct (scope1)`,
    },
    {
      specSecurityRequirements: [
        {
          "authorizer-1": [],
        },
        {
          "authorizer-2": [],
        },
      ],
      constructAuthorizer: Authorizers.iam(),
      expectedErrorMessage: `${operation} authorizers authorizer-1, authorizer-2 defined in the OpenAPI Spec or Smithy Model would be overridden by single construct authorizer ${
        Authorizers.iam().authorizerId
      }`,
    },
    {
      specSecurityRequirements: [],
      constructAuthorizer: Authorizers.iam(),
      expectedErrorMessage: `${operation} explicitly defines no auth in the OpenAPI Spec or Smithy Model which would be overridden by construct authorizer ${
        Authorizers.iam().authorizerId
      }`,
    },
  ];

  it.each(authorizerMismatchTestCases("Default"))(
    "Throws Error For Mismatching Default Authorizer",
    ({
      specSecurityRequirements,
      constructAuthorizer,
      expectedErrorMessage,
    }) => {
      const stack = new Stack();
      const func = new Function(stack, "Lambda", {
        code: Code.fromInline("code"),
        handler: "handler",
        runtime: Runtime.NODEJS_16_X,
      });
      const spec = {
        ...sampleSpec,
        security: specSecurityRequirements,
      };
      withTempSpec(spec, (specPath) => {
        expect(() => {
          new OpenApiGatewayRestApi(stack, "ApiTest", {
            defaultAuthorizer: constructAuthorizer,
            spec,
            specPath,
            operationLookup,
            integrations: {
              testOperation: {
                integration: Integrations.lambda(func),
              },
            },
          });
        }).toThrow(expectedErrorMessage);
      });
    }
  );

  it.each(authorizerMismatchTestCases("testOperation"))(
    "Throws Error For Mismatching Method-Level Authorizer",
    ({
      specSecurityRequirements,
      constructAuthorizer,
      expectedErrorMessage,
    }) => {
      const stack = new Stack();
      const func = new Function(stack, "Lambda", {
        code: Code.fromInline("code"),
        handler: "handler",
        runtime: Runtime.NODEJS_16_X,
      });
      const spec = {
        ...sampleSpec,
        paths: {
          "/test": {
            get: {
              ...(sampleSpec.paths["/test"]!.get as any),
              security: specSecurityRequirements,
            },
          },
        },
      };
      withTempSpec(spec, (specPath) => {
        expect(() => {
          new OpenApiGatewayRestApi(stack, "ApiTest", {
            spec,
            specPath,
            operationLookup,
            integrations: {
              testOperation: {
                integration: Integrations.lambda(func),
                authorizer: constructAuthorizer,
              },
            },
          });
        }).toThrow(expectedErrorMessage);
      });
    }
  );

  it("Throws For Clashing Security Schemes", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const spec = {
      ...sampleSpec,
      components: {
        securitySchemes: {
          "my-custom-scheme": {
            type: "oauth2",
            flows: {},
          } as any,
        },
      },
    };
    withTempSpec(spec, (specPath) => {
      expect(() => {
        new OpenApiGatewayRestApi(stack, "ApiTest", {
          defaultAuthorizer: Authorizers.custom({
            authorizerId: "my-custom-scheme",
            function: func,
          }),
          spec,
          specPath,
          operationLookup,
          integrations: {
            testOperation: {
              integration: Integrations.lambda(func),
            },
          },
        });
      }).toThrow();
    });
  });

  it("Throws For Clashing ApiGateway Security Schemes", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const spec = {
      ...sampleSpec,
      components: {
        securitySchemes: {
          "my-custom-scheme": {
            type: "apiKey",
            name: "my-scheme",
            in: "header",
            "x-amazon-apigateway-authtype": "COGNITO_USER_POOLS",
          } as any,
        },
      },
    };
    withTempSpec(spec, (specPath) => {
      expect(() => {
        new OpenApiGatewayRestApi(stack, "ApiTest", {
          defaultAuthorizer: Authorizers.custom({
            authorizerId: "my-custom-scheme",
            function: func,
          }),
          spec,
          specPath,
          operationLookup,
          integrations: {
            testOperation: {
              integration: Integrations.lambda(func),
            },
          },
        });
      }).toThrow();
    });
  });
});
