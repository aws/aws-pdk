/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
/**
 * HTTP Methods supported by Open API v3
 */
export enum HttpMethods {
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
 * Default authorizer identifiers
 */
export enum DefaultAuthorizerIds {
  NONE = "none",
  IAM = "aws.auth.sigv4",
}
