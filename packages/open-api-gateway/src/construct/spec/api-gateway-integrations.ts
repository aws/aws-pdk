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

import { IFunction } from "aws-cdk-lib/aws-lambda";
import { CustomAuthorizer } from "../authorizers";
import { isCustomAuthorizer } from "../authorizers/predicates";
import { getAllAuthorizers } from "./api-gateway-auth";
import { OpenApiOptions } from "./api-gateway-integrations-types";

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
const getLabelledAuthorizerFunctions = (
  options: OpenApiOptions
): LabelledFunction[] =>
  getAllAuthorizers(options.integrations, options.defaultAuthorizer)
    .filter((authorizer) => isCustomAuthorizer(authorizer))
    .map((authorizer) => ({
      label: authorizer.authorizerId,
      function: (authorizer as CustomAuthorizer).function,
    }));

/**
 * Return all lambda functions used in integrations, labelled by operation
 */
const getLabelledIntegrationFunctions = (
  options: OpenApiOptions
): LabelledFunction[] =>
  Object.entries(options.integrations).map(([operationId, integration]) => ({
    label: operationId,
    function: integration.function,
  }));

/**
 * Return all lambda functions that may be invoked by api gateway
 */
export const getLabelledFunctions = (options: OpenApiOptions) =>
  getLabelledAuthorizerFunctions(options).concat(
    getLabelledIntegrationFunctions(options)
  );
