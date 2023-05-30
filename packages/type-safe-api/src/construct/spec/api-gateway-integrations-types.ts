/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { ApiKeySourceType, CorsOptions } from "aws-cdk-lib/aws-apigateway";
import { Authorizer } from "../authorizers";
import { Integration } from "../integrations";

/**
 * Options for an integration
 */
export interface TypeSafeApiIntegrationOptions {
  /**
   * Require an API key to invoke this operation. Overrides the default setting if present.
   * This is only applicable when the API key source is HEADER.
   * @default false
   */
  readonly apiKeyRequired?: boolean;
}

/**
 * Defines an integration for an individual API operation
 */
export interface TypeSafeApiIntegration {
  /**
   * The integration to service the api operation
   */
  readonly integration: Integration;
  /**
   * The authorizer to use for this api operation (overrides the default)
   */
  readonly authorizer?: Authorizer;
  /**
   * Options for the integration
   */
  readonly options?: TypeSafeApiIntegrationOptions;
}

/**
 * A mapping of operation id to the integration for that operation
 */
export type TypeSafeApiIntegrations = {
  readonly [operationId: string]: TypeSafeApiIntegration;
};

/**
 * An http method
 */
export type Method =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

/**
 * Structure to contain an API operation's method and path
 */
export interface MethodAndPath {
  /**
   * The path of this operation in the api
   */
  readonly path: string;
  /**
   * The http method of this operation
   */
  readonly method: Method;
}

/**
 * Details about an API operation
 */
export interface OperationDetails extends MethodAndPath {
  /**
   * Content types accepted by this operation
   * @default application/json
   */
  readonly contentTypes?: string[];
}

/**
 * Type for the generated Operation Lookup structure, providing details about the method and path of each API operation
 */
export type OperationLookup = {
  readonly [operationId: string]: OperationDetails;
};

/**
 * Options for API keys
 */
export interface ApiKeyOptions {
  /**
   * Source type for an API key
   */
  readonly source: ApiKeySourceType;
  /**
   * Set to true to require an API key on all operations by default.
   * Only applicable when the source is HEADER.
   */
  readonly requiredByDefault?: boolean;
}

/**
 * Options required alongside an Open API specification to create API Gateway resources
 */
export interface TypeSafeApiOptions {
  /**
   * A mapping of API operation to its integration
   */
  readonly integrations: TypeSafeApiIntegrations;
  /**
   * Details about each operation
   */
  readonly operationLookup: OperationLookup;
  /**
   * The default authorizer to use for your api. When omitted, no default authorizer is used.
   * Authorizers specified at the integration level will override this for that operation.
   */
  readonly defaultAuthorizer?: Authorizer;
  /**
   * Cross Origin Resource Sharing options for the API
   */
  readonly corsOptions?: CorsOptions;
  /**
   * Options for API keys
   */
  readonly apiKeyOptions?: ApiKeyOptions;
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
