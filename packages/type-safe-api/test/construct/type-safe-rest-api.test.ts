/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { PDKNag } from "@aws/pdk-nag";
import { Size, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ApiKeySourceType, Cors } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { NagSuppressions } from "cdk-nag";
import * as _ from "lodash";
import { OpenAPIV3 } from "openapi-types";
import { Integrations } from "../../lib";
import {
  MethodAndPath,
  TypeSafeRestApi,
  ApiKeyOptions,
  TypeSafeApiIntegrationOptions,
} from "../../src/construct";
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

const snapshotExtendedSpec = (api: TypeSafeRestApi) => {
  const specWithoutTokens = _.cloneDeepWith(
    api.extendedApiSpecification,
    (v) => {
      if (_.isString(v)) {
        // Replace any CDK tokens since these have non-deterministic identifiers which
        // would change the snapshot every time
        return (v as string).replace(/Token\[[^\]]+]/g, "<TOKEN>");
      }
      return undefined;
    }
  );
  expect(specWithoutTokens).toMatchSnapshot();
};

describe("Type Safe Rest Api Construct Unit Tests", () => {
  it("Synth", () => {
    const stack = new Stack(PDKNag.app());
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
      });
      ["AwsSolutions-IAM4", "AwsPrototyping-IAMNoManagedPolicies"].forEach(
        (RuleId) => {
          NagSuppressions.addResourceSuppressions(
            func,
            [
              {
                id: RuleId,
                reason: "This is a test construct.",
              },
            ],
            true
          );
        }
      );
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
      snapshotExtendedSpec(api);
    });
  });

  it("Create 2 APIs on same stack", () => {
    const stack = new Stack(PDKNag.app());
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new TypeSafeRestApi(stack, "ApiTest1", {
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
      });
      new TypeSafeRestApi(stack, "ApiTest2", {
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
      });
      ["AwsSolutions-IAM4", "AwsPrototyping-IAMNoManagedPolicies"].forEach(
        (RuleId) => {
          NagSuppressions.addResourceSuppressions(
            func,
            [
              {
                id: RuleId,
                reason: "This is a test construct.",
              },
            ],
            true
          );
        }
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
        "/test/{param1}/fixed/{param2}/{param3}": {
          get: testOperation,
        },
      },
    };

    withTempSpec(spec, (specPath) => {
      const api = new TypeSafeRestApi(stack, "ApiTest", {
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
      snapshotExtendedSpec(api);
    });
  });

  it("With Mock Integration", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.mock({
              statusCode: 200,
              body: JSON.stringify({ message: "message" }),
            }),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
      snapshotExtendedSpec(api);
    });
  });

  it("With Mock Integration and CORS", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        specPath,
        operationLookup,
        corsOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: Cors.ALL_METHODS,
        },
        integrations: {
          testOperation: {
            integration: Integrations.mock({
              statusCode: 200,
              body: JSON.stringify({ message: "message" }),
            }),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
      snapshotExtendedSpec(api);
    });
  });

  it("With IAM Auth and CORS", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.iam(),
        corsOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: Cors.ALL_METHODS,
          allowCredentials: true,
          statusCode: 200,
        },
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
      snapshotExtendedSpec(api);
    });
  });

  it("With Cognito Auth", () => {
    const stack = new Stack();

    const authorizer = Authorizers.cognito({
      authorizerId: "myCognitoAuthorizer",
      userPools: [new UserPool(stack, "pool")],
    });

    withTempSpec(sampleSpec, (specPath) => {
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        defaultAuthorizer: authorizer,
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
      snapshotExtendedSpec(api);
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
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        defaultAuthorizer: authorizer,
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
      snapshotExtendedSpec(api);
    });
  });

  it("With Mixed Auth", () => {
    const stack = new Stack();

    const lambdaIntegration = (id: string) =>
      new Function(stack, `LambdaIntegration${id}`, {
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
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.iam(),
        specPath,
        operationLookup: multiOperationLookup as any,
        integrations: {
          getOperation: {
            integration: Integrations.lambda(lambdaIntegration("a")),
            authorizer: cognitoAuthorizer,
          },
          putOperation: {
            integration: Integrations.lambda(lambdaIntegration("b")),
            authorizer: cognitoAuthorizer.withScopes("other/scope"),
          },
          postOperation: {
            integration: Integrations.lambda(lambdaIntegration("c")),
            authorizer: customAuthorizer,
          },
          deleteOperation: {
            integration: Integrations.lambda(lambdaIntegration("d")),
            // authorizer not specified default should be used
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
      snapshotExtendedSpec(api);
    });
  });

  it("Should Throw When Integration Missing", () => {
    const stack = new Stack();
    withTempSpec(sampleSpec, (specPath) => {
      expect(
        () =>
          new TypeSafeRestApi(stack, "ApiTest", {
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
          new TypeSafeRestApi(stack, "ApiTest", {
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
      new TypeSafeRestApi(stack, "ApiTest", {
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
      new TypeSafeRestApi(stack, "ApiTest", {
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
      new TypeSafeRestApi(stack, "ApiTest", {
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

  it("Local Mode", () => {
    const stack = new Stack();
    stack.node.setContext("type-safe-api-local", "true");
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_18_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new TypeSafeRestApi(stack, "ApiTest", {
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
      new TypeSafeRestApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.none(),
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
          new TypeSafeRestApi(stack, "ApiTest", {
            defaultAuthorizer: constructAuthorizer,
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
          new TypeSafeRestApi(stack, "ApiTest", {
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
        new TypeSafeRestApi(stack, "ApiTest", {
          defaultAuthorizer: Authorizers.custom({
            authorizerId: "my-custom-scheme",
            function: func,
          }),
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
        new TypeSafeRestApi(stack, "ApiTest", {
          defaultAuthorizer: Authorizers.custom({
            authorizerId: "my-custom-scheme",
            function: func,
          }),
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

  it("Throws For Unsupported HTTP Method", () => {
    const stack = new Stack();
    const func = (id: string) =>
      new Function(stack, `Lambda${id}`, {
        code: Code.fromInline("code"),
        handler: "handler",
        runtime: Runtime.NODEJS_16_X,
      });
    const spec = {
      ...sampleSpec,
      paths: {
        "/unsupported/method": {
          // Type for keys restricts to valid HttpMethods, so cast as any to avoid compile error
          ["any" as any]: {
            operationId: "unsupportedOperation",
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
    withTempSpec(spec, (specPath) => {
      expect(() => {
        new TypeSafeRestApi(stack, "ApiTest", {
          defaultAuthorizer: Authorizers.custom({
            authorizerId: "my-custom-scheme",
            function: func("authorizer"),
          }),
          specPath,
          operationLookup,
          integrations: {
            testOperation: {
              integration: Integrations.lambda(func("a")),
            },
            unsupportedOperation: {
              integration: Integrations.lambda(func("b")),
            },
          },
        });
      }).toThrow(/Path \/unsupported\/method contains unsupported method any./);
    });
  });

  interface ApiKeyTestCase {
    defaultAuthorizer?: Authorizer;
    apiKeyOptions?: ApiKeyOptions;
    methodAuthorizer?: Authorizer;
    methodOptions?: TypeSafeApiIntegrationOptions;
  }

  const happyApiKeyCases: { [key: string]: ApiKeyTestCase } = {
    "01. Empty": {},
    "02. Header": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
      },
    },
    "03. Authorizer": {
      apiKeyOptions: {
        source: ApiKeySourceType.AUTHORIZER,
      },
    },
    "04. Header Required": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
      },
      methodOptions: { apiKeyRequired: true },
    },
    "05. Header Not Required": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
      },
      methodOptions: { apiKeyRequired: false },
    },
    "06. Header Required And Default Authorizer": {
      defaultAuthorizer: Authorizers.iam(),
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
      },
      methodOptions: { apiKeyRequired: true },
    },
    "07. Header Not Required And Default Authorizer": {
      defaultAuthorizer: Authorizers.iam(),
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
      },
      methodOptions: { apiKeyRequired: false },
    },
    "08. Header Required And Method Authorizer": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
      },
      methodOptions: { apiKeyRequired: true },
      methodAuthorizer: Authorizers.iam(),
    },
    "09. Header Not Required And Method Authorizer": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
      },
      methodOptions: { apiKeyRequired: false },
      methodAuthorizer: Authorizers.iam(),
    },
    "10. Header Required By Default": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
        requiredByDefault: true,
      },
    },
    "11. Header Required By Default But Not Required For Method": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
        requiredByDefault: true,
      },
      methodOptions: { apiKeyRequired: false },
    },
    "12. Header Required By Default With Default Authorizer": {
      defaultAuthorizer: Authorizers.iam(),
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
        requiredByDefault: true,
      },
    },
    "13. Header Required By Default With Method Authorizer": {
      apiKeyOptions: {
        source: ApiKeySourceType.HEADER,
        requiredByDefault: true,
      },
      methodAuthorizer: Authorizers.iam(),
    },
    "14. Header Required By Default With Default Authorizer But Not Required For Method":
      {
        defaultAuthorizer: Authorizers.iam(),
        apiKeyOptions: {
          source: ApiKeySourceType.HEADER,
          requiredByDefault: true,
        },
        methodOptions: { apiKeyRequired: false },
      },
  };

  it.each(Object.keys(happyApiKeyCases).sort())(
    "Synth With ApiKey Configuration %s",
    (caseName) => {
      const stack = new Stack();
      const testCase = happyApiKeyCases[caseName];
      withTempSpec(sampleSpec, (specPath) => {
        const api = new TypeSafeRestApi(stack, "ApiTest", {
          defaultAuthorizer: testCase.defaultAuthorizer,
          specPath,
          operationLookup,
          apiKeyOptions: testCase.apiKeyOptions,
          integrations: {
            testOperation: {
              integration: Integrations.lambda(
                new Function(stack, "Lambda", {
                  code: Code.fromInline("code"),
                  handler: "handler",
                  runtime: Runtime.NODEJS_16_X,
                })
              ),
              authorizer: testCase.methodAuthorizer,
              options: testCase.methodOptions,
            },
          },
        });
        snapshotExtendedSpec(api);
      });
    }
  );

  const sadApiKeyCases: { [key: string]: ApiKeyTestCase } = {
    "01. Authorizer Required": {
      apiKeyOptions: { source: ApiKeySourceType.AUTHORIZER },
      methodOptions: { apiKeyRequired: true },
    },
    "02. Api Key Required Without Api Key Options": {
      methodOptions: { apiKeyRequired: true },
    },
    "03. Authorizer Required By Default": {
      apiKeyOptions: {
        source: ApiKeySourceType.AUTHORIZER,
        requiredByDefault: true,
      },
    },
  };

  it.each(Object.keys(sadApiKeyCases).sort())(
    "Fails To Synth With ApiKey Configuration %s",
    (caseName) => {
      const stack = new Stack();
      const testCase = sadApiKeyCases[caseName];
      withTempSpec(sampleSpec, (specPath) => {
        expect(() => {
          new TypeSafeRestApi(stack, "ApiTest", {
            defaultAuthorizer: testCase.defaultAuthorizer,
            specPath,
            operationLookup,
            apiKeyOptions: testCase.apiKeyOptions,
            integrations: {
              testOperation: {
                integration: Integrations.lambda(
                  new Function(stack, "Lambda", {
                    code: Code.fromInline("code"),
                    handler: "handler",
                    runtime: Runtime.NODEJS_16_X,
                  })
                ),
                authorizer: testCase.methodAuthorizer,
                options: testCase.methodOptions,
              },
            },
          });
        }).toThrow();
      });
    }
  );

  it("Should enable compression", () => {
    const stack = new Stack();
    const func = new Function(stack, "Lambda", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(sampleSpec, (specPath) => {
      new TypeSafeRestApi(stack, "ApiTest", {
        specPath,
        operationLookup,
        integrations: {
          testOperation: {
            integration: Integrations.lambda(func),
          },
        },
        minCompressionSize: Size.bytes(20),
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("Should consolidate permissions for reused lambdas", () => {
    const stack = new Stack();
    const func1 = new Function(stack, "Lambda1", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    const func2 = new Function(stack, "Lambda2", {
      code: Code.fromInline("code"),
      handler: "handler",
      runtime: Runtime.NODEJS_16_X,
    });
    withTempSpec(multiOperationSpec, (specPath) => {
      new TypeSafeRestApi(stack, "ApiTest", {
        specPath,
        operationLookup: multiOperationLookup as any,
        integrations: {
          getOperation: {
            integration: Integrations.lambda(func1),
          },
          putOperation: {
            integration: Integrations.lambda(func1),
          },
          postOperation: {
            integration: Integrations.lambda(func2),
          },
          deleteOperation: {
            integration: Integrations.lambda(func1),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
    });
  });

  it("Should add header parameters to CORS Access-Control-Allow-Headers", () => {
    const stack = new Stack();

    const spec: OpenAPIV3.Document = {
      ...multiOperationSpec,
      paths: {
        "/test": {
          ...multiOperationSpec.paths["/test"]!,
          get: {
            ...multiOperationSpec.paths["/test"]!.get!,
            parameters: [
              {
                in: "query",
                name: "notAHeader",
                schema: { type: "string" },
              },
              {
                in: "header",
                name: "x-shared-header",
                schema: { type: "string" },
              },
              {
                in: "header",
                name: "X-Different-Header",
                schema: { type: "number" },
              },
            ],
          },
          put: {
            ...multiOperationSpec.paths["/test"]!.put!,
            parameters: [
              {
                in: "query",
                name: "anotherQueryParam",
                schema: { type: "string" },
              },
              {
                in: "header",
                name: "x-shared-header",
                schema: { type: "string" },
              },
              {
                in: "header",
                name: "x-another-header",
                schema: { type: "integer" },
              },
            ],
          },
        },
      },
    };

    withTempSpec(spec, (specPath) => {
      const api = new TypeSafeRestApi(stack, "ApiTest", {
        defaultAuthorizer: Authorizers.iam(),
        corsOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: Cors.ALL_METHODS,
          allowCredentials: true,
          statusCode: 200,
        },
        specPath,
        operationLookup: multiOperationLookup as any,
        integrations: {
          getOperation: {
            integration: Integrations.lambda(
              new Function(stack, "Lambda1", {
                code: Code.fromInline("code"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              })
            ),
          },
          putOperation: {
            integration: Integrations.lambda(
              new Function(stack, "Lambda2", {
                code: Code.fromInline("code"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              })
            ),
          },
          deleteOperation: {
            integration: Integrations.lambda(
              new Function(stack, "Lambda3", {
                code: Code.fromInline("code"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              })
            ),
          },
          postOperation: {
            integration: Integrations.lambda(
              new Function(stack, "Lambda4", {
                code: Code.fromInline("code"),
                handler: "handler",
                runtime: Runtime.NODEJS_16_X,
              })
            ),
          },
        },
      });
      expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
      snapshotExtendedSpec(api);
    });
  });
});
