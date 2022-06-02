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
import {
  AuthorizationType,
  Cors,
  CorsOptions,
  PassthroughBehavior,
  ResponseType,
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { OpenAPIV3 } from "openapi-types";
import {
  MethodAndPath,
  OpenApiIntegrations,
  OpenApiOptions,
} from "./api-gateway-integrations-types";

const concatMethodAndPath = ({ method, path }: MethodAndPath) =>
  `${method.toLowerCase()}||${path.toLowerCase()}`;

/**
 * Adds API Gateway integrations and auth to the given operation
 */
const applyMethodIntegration = (
  scope: Construct,
  path: string,
  method: string,
  { integrations, authType, corsOptions }: OpenApiOptions,
  operation: OpenAPIV3.OperationObject,
  getOperationName: (methodAndPath: MethodAndPath) => string
): OpenAPIV3.OperationObject | undefined => {
  const operationName = getOperationName({ method, path });
  if (!(operationName in integrations)) {
    throw new Error(
      `Missing required integration for operation ${operationName} (${method} ${path})`
    );
  }

  const {
    function: { functionArn },
  } = integrations[operationName as keyof OpenApiIntegrations];

  // Generate the lambda invocation arn as the uri for the API Gateway integration
  const stack = Stack.of(scope);
  const uri = `arn:${stack.partition}:apigateway:${stack.region}:lambda:path/2015-03-31/functions/${functionArn}/invocations`;

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
      uri,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
    },
    "x-amazon-apigateway-auth": {
      type: authType || AuthorizationType.NONE,
    },
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
  corsOptions: CorsOptions
): { [key: string]: string } => ({
  "Access-Control-Allow-Headers": `'${(
    corsOptions.allowHeaders || Cors.DEFAULT_HEADERS
  ).join(",")}'`,
  "Access-Control-Allow-Methods": `'${(
    corsOptions.allowMethods || Cors.ALL_METHODS
  ).join(",")}'`,
  "Access-Control-Allow-Origin": `'${corsOptions.allowOrigins.join(",")}'`,
});

const generateCorsResponseParameters = (
  corsOptions: CorsOptions,
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
  { corsOptions }: OpenApiOptions
): OpenAPIV3.PathItemObject => {
  // Do not generate if already manually defined, or cors not enabled
  if (OpenAPIV3.HttpMethods.OPTIONS in pathItem || !corsOptions) {
    return {};
  }

  const statusCode = corsOptions.statusCode || 204;

  return {
    [OpenAPIV3.HttpMethods.OPTIONS]: {
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
  scope: Construct,
  path: string,
  pathItem: OpenAPIV3.PathItemObject,
  options: OpenApiOptions,
  getOperationName: (methodAndPath: MethodAndPath) => string
): OpenAPIV3.PathItemObject => {
  return {
    ...pathItem,
    ...Object.fromEntries(
      Object.values(OpenAPIV3.HttpMethods)
        .filter((method) => pathItem[method])
        .map((method) => [
          method,
          applyMethodIntegration(
            scope,
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
  scope: Construct,
  spec: OpenAPIV3.Document,
  options: OpenApiOptions
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
      [ResponseType.BAD_REQUEST_BODY.responseType]: {
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
          preparePathSpec(scope, path, pathDetails!, options, getOperationName),
        ])
      ),
    },
  } as any;
};
