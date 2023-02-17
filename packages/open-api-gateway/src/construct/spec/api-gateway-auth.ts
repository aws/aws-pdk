/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { OpenAPIV3 } from "openapi-types";
import { OpenApiIntegrations } from "./api-gateway-integrations-types";
import { functionInvocationUri } from "./utils";
import {
  Authorizer,
  CognitoAuthorizer,
  CustomAuthorizer,
  CustomAuthorizerType,
} from "../authorizers";
import {
  isCognitoAuthorizer,
  isCustomAuthorizer,
  isIamAuthorizer,
} from "../authorizers/predicates";

/**
 * Snippet of OpenAPI API Gateway extension for a cognito x-amazon-apigateway-authorizer
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html
 */
export interface CognitoApiGatewayAuthorizer {
  /**
   * The type of authorizer (always cognito_user_pools)
   */
  readonly type: AuthorizationType.COGNITO;
  /**
   * The arns of the user pools used to authorize the request
   */
  readonly providerARNs: string[];
}

/**
 * Snippet of OpenAPI API Gateway extension for a custom x-amazon-apigateway-authorizer
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-authorizer.html
 */
export interface CustomApiGatewayAuthorizer {
  /**
   * Type of custom authorizer
   */
  readonly type: CustomAuthorizerType;
  /**
   * The part of the request that denotes the identity of the caller
   */
  readonly identitySource?: string;
  /**
   * The lambda invocation uri for the custom authorizer
   */
  readonly authorizerUri: string;
  /**
   * The time in seconds that the authorizer result is cached given the same identity source
   */
  readonly authorizerResultTtlInSeconds: number;
}

/**
 * Open API definition for an api gateway security scheme
 */
export interface ApiGatewaySecurityScheme
  extends OpenAPIV3.ApiKeySecurityScheme {
  /**
   * The type of api gateway authorizer
   */
  readonly "x-amazon-apigateway-authtype": string;
}

/**
 * Open API definition for an api gateway security scheme with authorizer details
 */
export interface ApiGatewaySecuritySchemeWithAuthorizer<AuthorizerType>
  extends ApiGatewaySecurityScheme {
  /**
   * Details about the authorizer
   */
  readonly "x-amazon-apigateway-authorizer": AuthorizerType;
}

/**
 * The security scheme for a cognito authorizer
 */
export type CognitoSecurityScheme =
  ApiGatewaySecuritySchemeWithAuthorizer<CognitoApiGatewayAuthorizer>;

/**
 * The security scheme for a custom authorizer
 */
export type CustomSecurityScheme =
  ApiGatewaySecuritySchemeWithAuthorizer<CustomApiGatewayAuthorizer>;

/**
 * The security scheme for an iam authorizer
 */
export type IamSecurityScheme = ApiGatewaySecurityScheme;

// Regex to match against a single header identity source
const SINGLE_HEADER_IDENTITY_SOURCE_REGEX =
  /^method.request.header.(?<header>[^\.\s,]+)$/;

/**
 * Serialised representation of a method authorizer
 */
export interface SerialisedAuthorizerReference {
  /**
   * The unique identifier of the authorizer to reference
   */
  readonly authorizerId: string;
  /**
   * Scopes to use for this particular authorizer reference
   */
  readonly authorizationScopes?: string[];
}

/**
 * Build a serialized reference to an authorizer for use in an api method
 * @param authorizer the author to serialize
 */
export const serializeAsAuthorizerReference = (
  authorizer?: Authorizer
): SerialisedAuthorizerReference | undefined =>
  authorizer
    ? {
        authorizerId: authorizer.authorizerId,
        authorizationScopes: authorizer.authorizationScopes,
      }
    : undefined;

/**
 * Create an OpenAPI security scheme definition for an iam authorizer
 * @see https://docs.amazonaws.cn/en_us/apigateway/latest/developerguide/api-gateway-swagger-extensions-authtype.html
 */
const iamSecurityScheme = (): IamSecurityScheme => ({
  type: "apiKey",
  name: "Authorization",
  in: "header",
  "x-amazon-apigateway-authtype": "awsSigv4",
});

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
    type: AuthorizationType.COGNITO,
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
 * Return a list of all unique authorizers used in the api
 */
export const getAllAuthorizers = (
  integrations: OpenApiIntegrations,
  defaultAuthorizer?: Authorizer
): Authorizer[] =>
  Object.values(
    Object.fromEntries(
      [
        ...(defaultAuthorizer ? [defaultAuthorizer] : []),
        ...Object.values(integrations).flatMap(({ authorizer }) =>
          authorizer ? [authorizer] : []
        ),
      ].map((a) => [a.authorizerId, a])
    )
  );

/**
 * Generate the security schemes section of an OpenAPI specification
 */
export const prepareSecuritySchemes = (
  scope: Construct,
  integrations: OpenApiIntegrations,
  defaultAuthorizer?: Authorizer
): { [key: string]: OpenAPIV3.SecuritySchemeObject } => {
  // All the defined authorizers
  const allAuthorizers = getAllAuthorizers(integrations, defaultAuthorizer);

  // Cognito, IAM and custom authorizers must be declared in security schemes
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
    ...Object.fromEntries(
      allAuthorizers
        .filter((authorizer) => isIamAuthorizer(authorizer))
        .map((authorizer) => [authorizer.authorizerId, iamSecurityScheme()])
    ),
  };
};
