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
import type { OpenAPIV3 } from "openapi-types";
import type {
  Method,
  MethodAndPath,
  OpenApiIntegrations,
  OperationLookup,
} from "../spec";
import { SerialisedAuthorizerReference } from "../spec/api-gateway-auth";

/**
 * Serialise a method and path into a single string
 */
export const concatMethodAndPath = ({ method, path }: MethodAndPath) =>
  `${method.toLowerCase()}||${path.toLowerCase()}`;

/**
 * Serialized integration for a method
 */
export interface SerializedMethodIntegration {
  /**
   * The lambda function invocation uri for the api method
   */
  readonly functionInvocationUri: string;
  /**
   * The authorizer (if any) to apply to the method
   */
  readonly methodAuthorizer?: SerialisedAuthorizerReference;
}

/**
 * Cross-origin resource sharing options
 */
export interface SerializedCorsOptions {
  /**
   * HTTP methods to allow
   */
  readonly allowMethods: string[];
  /**
   * Headers to allow
   */
  readonly allowHeaders: string[];
  /**
   * Origins to allow
   */
  readonly allowOrigins: string[];
  /**
   * HTTP status code to be returned by preflight requests
   */
  readonly statusCode: number;
}

/**
 * Options for preparing an api spec for deployment by api gateway
 */
export interface PrepareApiSpecOptions {
  /**
   * Integrations for api operations
   */
  readonly integrations: { [operationId: string]: SerializedMethodIntegration };
  /**
   * Options for cross-origin resource sharing
   */
  readonly corsOptions?: SerializedCorsOptions;
  /**
   * Operation id to method and path mapping
   */
  readonly operationLookup: OperationLookup;
  /**
   * Security schemes to add to the spec
   */
  readonly securitySchemes: { [key: string]: OpenAPIV3.SecuritySchemeObject };
}

/**
 * HTTP methods supported by Open API v3
 */
enum HttpMethods {
  GET = "get",
  PUT = "put",
  POST = "post",
  DELETE = "delete",
  OPTIONS = "options",
  HEAD = "head",
  PATCH = "patch",
  TRACE = "trace",
}

/**
 * Create the OpenAPI definition with api gateway extensions for the given authorizer
 * @param methodAuthorizer the authorizer used for the method
 */
const applyMethodAuthorizer = (
  methodAuthorizer?: SerialisedAuthorizerReference
) => {
  if (methodAuthorizer) {
    return {
      security: [
        {
          [methodAuthorizer.authorizerId]:
            methodAuthorizer.authorizationScopes || [],
        },
      ],
    };
  }

  // NONE is specified via x-amazon-apigateway-auth
  return {
    "x-amazon-apigateway-auth": {
      type: "NONE",
    },
  };
};

/**
 * Adds API Gateway integrations and auth to the given operation
 */
const applyMethodIntegration = (
  path: string,
  method: Method,
  { integrations, corsOptions }: PrepareApiSpecOptions,
  operation: OpenAPIV3.OperationObject,
  getOperationName: (methodAndPath: MethodAndPath) => string
): OpenAPIV3.OperationObject | undefined => {
  const operationName = getOperationName({ method, path });
  if (!(operationName in integrations)) {
    throw new Error(
      `Missing required integration for operation ${operationName} (${method} ${path})`
    );
  }

  const { methodAuthorizer, functionInvocationUri } =
    integrations[operationName as keyof OpenApiIntegrations];

  return {
    ...operation,
    responses: Object.fromEntries(
      Object.entries(operation.responses).map(([statusCode, response]) => [
        statusCode,
        {
          ...response,
          headers: {
            ...(corsOptions ? getCorsHeaderDefinitions() : {}),
            // TODO: Consider following response header references
            ...(response as OpenAPIV3.ResponseObject).headers,
          },
        },
      ])
    ),
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html
    "x-amazon-apigateway-integration": {
      type: "AWS_PROXY",
      httpMethod: "POST",
      uri: functionInvocationUri,
      passthroughBehavior: "WHEN_NO_MATCH",
    },
    ...applyMethodAuthorizer(methodAuthorizer),
  } as any;
};

const getCorsHeaderDefinitions = (): {
  [name: string]: OpenAPIV3.HeaderObject;
} => ({
  "Access-Control-Allow-Origin": {
    schema: { type: "string" },
  },
  "Access-Control-Allow-Methods": {
    schema: { type: "string" },
  },
  "Access-Control-Allow-Headers": {
    schema: { type: "string" },
  },
});

const generateCorsResponseHeaders = (
  corsOptions: SerializedCorsOptions
): { [key: string]: string } => ({
  "Access-Control-Allow-Headers": `'${corsOptions.allowHeaders.join(",")}'`,
  "Access-Control-Allow-Methods": `'${corsOptions.allowMethods.join(",")}'`,
  "Access-Control-Allow-Origin": `'${corsOptions.allowOrigins.join(",")}'`,
});

const generateCorsResponseParameters = (
  corsOptions: SerializedCorsOptions,
  prefix: string = "method.response.header"
): { [key: string]: string } =>
  Object.fromEntries(
    Object.entries(generateCorsResponseHeaders(corsOptions)).map(
      ([header, value]) => [`${prefix}.${header}`, value]
    )
  );

/**
 * Generates an "options" method with no auth to respond with the appropriate headers if cors is enabled
 */
const generateCorsOptionsMethod = (
  pathItem: OpenAPIV3.PathItemObject,
  { corsOptions }: PrepareApiSpecOptions
): OpenAPIV3.PathItemObject => {
  // Do not generate if already manually defined, or cors not enabled
  if (HttpMethods.OPTIONS in pathItem || !corsOptions) {
    return {};
  }

  const statusCode = corsOptions.statusCode;

  return {
    [HttpMethods.OPTIONS]: {
      summary: "CORS Support",
      description: "Enable CORS by returning the correct headers",
      responses: {
        [`${statusCode}`]: {
          description: "Default response for CORS method",
          headers: getCorsHeaderDefinitions(),
          content: {},
        },
      },
      // @ts-ignore Ignore apigateway extensions which are not part of default openapi spec type
      "x-amazon-apigateway-integration": {
        type: "mock",
        requestTemplates: {
          "application/json": `{"statusCode": ${statusCode}}`,
        },
        responses: {
          default: {
            statusCode: `${statusCode}`,
            responseParameters: generateCorsResponseParameters(corsOptions),
            responseTemplates: {
              "application/json": "{}",
            },
          },
        },
      },
    },
  };
};

/**
 * Prepares a given api path by adding integrations, configuring auth
 */
const preparePathSpec = (
  path: string,
  pathItem: OpenAPIV3.PathItemObject,
  options: PrepareApiSpecOptions,
  getOperationName: (methodAndPath: MethodAndPath) => string
): OpenAPIV3.PathItemObject => {
  return {
    ...pathItem,
    ...Object.fromEntries(
      Object.values(HttpMethods)
        .filter((method) => pathItem[method])
        .map((method) => [
          method,
          applyMethodIntegration(
            path,
            method,
            options,
            pathItem[method]!,
            getOperationName
          ),
        ])
    ),
    // Generate an 'options' method required for CORS preflight requests if cors is enabled
    ...generateCorsOptionsMethod(pathItem, options),
  };
};

/**
 * Prepares the api spec for deployment by adding integrations, configuring auth, etc
 */
export const prepareApiSpec = (
  spec: OpenAPIV3.Document,
  options: PrepareApiSpecOptions
): OpenAPIV3.Document => {
  // Reverse lookup for the operation name given a method and path
  const operationNameByPath = Object.fromEntries(
    Object.entries<MethodAndPath>(options.operationLookup).map(
      ([operationName, methodAndPath]) => [
        concatMethodAndPath(methodAndPath),
        operationName,
      ]
    )
  );
  const getOperationName = (methodAndPath: MethodAndPath) =>
    operationNameByPath[concatMethodAndPath(methodAndPath)];

  return {
    ...spec,
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-request-validators.html
    "x-amazon-apigateway-request-validators": {
      all: {
        validateRequestBody: true,
        validateRequestParameters: true,
      },
    },
    "x-amazon-apigateway-request-validator": "all",
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-gateway-responses.html
    "x-amazon-apigateway-gateway-responses": {
      BAD_REQUEST_BODY: {
        statusCode: 400,
        responseTemplates: {
          "application/json":
            '{"message": "$context.error.validationErrorString"}',
        },
        ...(options.corsOptions
          ? {
              responseParameters: generateCorsResponseParameters(
                options.corsOptions,
                "gatewayresponse.header"
              ),
            }
          : {}),
      },
    },
    paths: {
      ...Object.fromEntries(
        Object.entries(spec.paths).map(([path, pathDetails]) => [
          path,
          preparePathSpec(path, pathDetails!, options, getOperationName),
        ])
      ),
    },
    components: {
      ...spec.components,
      securitySchemes: options.securitySchemes,
    },
  } as any;
};
