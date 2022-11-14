/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CorsOptions } from "aws-cdk-lib/aws-apigateway";
import { Authorizer } from "../authorizers";
import { Integration } from "../integrations";

/**
 * Defines an integration for an individual API operation
 */
export interface OpenApiIntegration {
  /**
   * The lambda function to service the api operation
   */
  readonly integration: Integration;
  /**
   * The authorizer to use for this api operation (overrides the default)
   */
  readonly authorizer?: Authorizer;
}

/**
 * A mapping of operation id to the integration for that operation
 */
export type OpenApiIntegrations = {
  readonly [operationId: string]: OpenApiIntegration;
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
 * Type for the generated Operation Lookup structure, providing details about the method and path of each API operation
 */
export type OperationLookup = {
  readonly [operationId: string]: MethodAndPath;
};

/**
 * Options required alongside an Open API specification to create API Gateway resources
 */
export interface OpenApiOptions {
  /**
   * A mapping of API operation to its integration
   */
  readonly integrations: OpenApiIntegrations;
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
}
