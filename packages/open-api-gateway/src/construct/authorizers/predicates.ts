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
