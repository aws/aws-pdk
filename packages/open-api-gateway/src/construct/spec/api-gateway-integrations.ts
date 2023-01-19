/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { getAllAuthorizers } from "./api-gateway-auth";
import { OpenApiOptions } from "./api-gateway-integrations-types";
import { CustomAuthorizer } from "../authorizers";
import { isCustomAuthorizer } from "../authorizers/predicates";

/**
 * A lambda function with a label to identify it
 */
export interface LabelledFunction {
  /**
   * The label to identify the function - must be a concrete value, not a token
   */
  readonly label: string;
  /**
   * The lambda function
   */
  readonly function: IFunction;
}

/**
 * Return all lambda functions used as authorizers, labelled by authorizer id
 */
export const getAuthorizerFunctions = (
  options: OpenApiOptions
): LabelledFunction[] =>
  getAllAuthorizers(options.integrations, options.defaultAuthorizer)
    .filter((authorizer) => isCustomAuthorizer(authorizer))
    .map((authorizer) => ({
      label: authorizer.authorizerId,
      function: (authorizer as CustomAuthorizer).function,
    }));
