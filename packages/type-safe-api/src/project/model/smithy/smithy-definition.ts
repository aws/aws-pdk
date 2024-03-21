/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { SmithySampleCode } from "./components/smithy-sample-code";
import {
  SmithyProjectDefinition,
  SmithyProjectDefinitionOptions,
} from "./smithy-project-definition";
import { TypeSafeApiModelProject } from "../type-safe-api-model-project";

/**
 * Options for a smithy build project
 */
export interface SmithyDefinitionOptions
  extends SmithyProjectDefinitionOptions {}

/**
 * Creates a project which transforms a Smithy model to OpenAPI
 */
export class SmithyDefinition extends SmithyProjectDefinition {
  constructor(
    project: TypeSafeApiModelProject,
    options: SmithyDefinitionOptions
  ) {
    super(project, options);

    const { namespace: serviceNamespace, serviceName } =
      options.smithyOptions.serviceName;
    const firstHandlerLanguage = options.handlerLanguages?.[0];

    // Create the default smithy model
    new SmithySampleCode(project, {
      modelDir: this.modelDir,
      serviceName,
      serviceNamespace,
      firstHandlerLanguage,
    });
  }
}
