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
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { OpenAPIV3 } from "openapi-types";
import {
  Authorizer,
  CognitoAuthorizer,
  CustomAuthorizer,
  CustomAuthorizerType,
} from "../authorizers";
import {
  isCognitoAuthorizer,
  isCustomAuthorizer,
} from "../authorizers/predicates";
import { OpenApiOptions } from "./api-gateway-integrations-types";
import { functionInvocationUri } from "./utils";

export interface CognitoApiGatewayAuthorizer {
  readonly type: AuthorizationType;
  readonly providerARNs: string[];
}

export interface CognitoSecurityScheme extends OpenAPIV3.ApiKeySecurityScheme {
  readonly "x-amazon-apigateway-authtype": string;
  readonly "x-amazon-apigateway-authorizer": CognitoApiGatewayAuthorizer;
}

export interface CustomApiGatewayAuthorizer {
  readonly type: CustomAuthorizerType;
  readonly identitySource?: string;
  readonly authorizerUri: string;
  readonly authorizerResultTtlInSeconds: number;
}

export interface CustomSecurityScheme extends OpenAPIV3.ApiKeySecurityScheme {
  readonly "x-amazon-apigateway-authtype": string;
  readonly "x-amazon-apigateway-authorizer": CustomApiGatewayAuthorizer;
}

// Regex to match against a single header identity source
const SINGLE_HEADER_IDENTITY_SOURCE_REGEX =
  /^method.request.header.(?<header>[^\.\s,]+)$/;

/**
 * Create the OpenAPI definition with api gateway extensions for the given authorizer
 * @param authorizer the authorizer used for the method
 */
export const applyMethodAuthorizer = (authorizer: Authorizer) => {
  if (isCustomAuthorizer(authorizer) || isCognitoAuthorizer(authorizer)) {
    return {
      security: [
        {
          [authorizer.authorizerId]: isCognitoAuthorizer(authorizer)
            ? authorizer.authorizationScopes
            : [],
        },
      ],
    };
  }
  // IAM and NONE are specified via x-amazon-apigateway-auth
  return {
    "x-amazon-apigateway-auth": {
      type: authorizer.authorizationType,
    },
  };
};

/**
 * Create an OpenAPI security scheme definition for a cognito authorizer
 * @param authorizer cognito authorizer
 */
const cognitoSecurityScheme = (
  authorizer: CognitoAuthorizer
): CognitoSecurityScheme => ({
  type: "apiKey",
  name: "Authorization",
  in: "header",
  "x-amazon-apigateway-authtype": authorizer.authorizationType,
  "x-amazon-apigateway-authorizer": {
    type: authorizer.authorizationType,
    providerARNs: authorizer.userPools.map((pool) => pool.userPoolArn),
  },
});

/**
 * Create an OpenAPI security scheme definition for a custom authorizer
 * @param scope the scope in which the api construct is defined
 * @param authorizer custom authorizer
 */
const customSecurityScheme = (
  scope: Construct,
  authorizer: CustomAuthorizer
): CustomSecurityScheme => {
  const singleHeaderMatch = authorizer.identitySource.match(
    SINGLE_HEADER_IDENTITY_SOURCE_REGEX
  );
  const singleHeader = singleHeaderMatch
    ? singleHeaderMatch.groups!.header
    : undefined;

  // Token type must use a single header
  if (!singleHeader && authorizer.type === CustomAuthorizerType.TOKEN) {
    throw new Error(
      `identitySource must be a single header for a ${CustomAuthorizerType.TOKEN} authorizer, eg method.request.header.Authorization`
    );
  }

  return {
    type: "apiKey",
    in: "header",
    // When the identity source is not a single header, the value must be "Unused"
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-authorizer.html
    name: singleHeader ? singleHeader : "Unused",
    "x-amazon-apigateway-authtype": authorizer.authorizationType,
    "x-amazon-apigateway-authorizer": {
      type: authorizer.type,
      authorizerUri: functionInvocationUri(scope, authorizer.function),
      authorizerResultTtlInSeconds: authorizer.authorizerResultTtlInSeconds,
      identitySource: authorizer.identitySource,
    },
  };
};

/**
 * Return a list of all authorizers used in the api
 */
export const getAllAuthorizers = (options: OpenApiOptions): Authorizer[] => [
  ...(options.defaultAuthorizer ? [options.defaultAuthorizer] : []),
  ...Object.values(options.integrations).flatMap(({ authorizer }) =>
    authorizer ? [authorizer] : []
  ),
];

/**
 * Generate the security schemes section of an OpenAPI specification
 */
export const prepareSecuritySchemes = (
  scope: Construct,
  options: OpenApiOptions
): { [key: string]: OpenAPIV3.SecuritySchemeObject } => {
  // All the defined authorizers
  const allAuthorizers = getAllAuthorizers(options);

  // Cognito and custom authorizers must be declared in security schemes
  return {
    ...Object.fromEntries(
      allAuthorizers
        .filter((authorizer) => isCognitoAuthorizer(authorizer))
        .map((authorizer) => [
          authorizer.authorizerId,
          cognitoSecurityScheme(authorizer as CognitoAuthorizer),
        ])
    ),
    ...Object.fromEntries(
      allAuthorizers
        .filter((authorizer) => isCustomAuthorizer(authorizer))
        .map((authorizer) => [
          authorizer.authorizerId,
          customSecurityScheme(scope, authorizer as CustomAuthorizer),
        ])
    ),
  };
};
