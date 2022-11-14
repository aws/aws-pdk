/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import {
  Authorizer,
  CognitoAuthorizer,
  CustomAuthorizer,
  IamAuthorizer,
  NoneAuthorizer,
} from "./authorizers";

/**
 * Predicate for narrowing an authorizer to CustomAuthorizer
 */
export const isCustomAuthorizer = (
  authorizer: Authorizer
): authorizer is CustomAuthorizer =>
  authorizer.authorizationType === AuthorizationType.CUSTOM;

/**
 * Predicate for narrowing an authorizer to CognitoAuthorizer
 */
export const isCognitoAuthorizer = (
  authorizer: Authorizer
): authorizer is CognitoAuthorizer =>
  authorizer.authorizationType === AuthorizationType.COGNITO;

/**
 * Predicate for narrowing an authorizer to IamAuthorizer
 */
export const isIamAuthorizer = (
  authorizer: Authorizer
): authorizer is IamAuthorizer =>
  authorizer.authorizationType === AuthorizationType.IAM;

/**
 * Predicate for narrowing an authorizer to NoneAuthorizer
 */
export const isNoneAuthorizer = (
  authorizer: Authorizer
): authorizer is NoneAuthorizer =>
  authorizer.authorizationType === AuthorizationType.NONE;
