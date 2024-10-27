/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeSafeApiCommandEnvironment } from "../../codegen/components/type-safe-api-command-environment";
import { ModelLanguage } from "../../types";
import { ModelReadme } from "../model-readme";
import {
  TypeSafeApiModelBuild,
  TypeSafeApiModelBuildOutputOptions,
} from "../type-safe-api-model-build";
import { SmithySampleCode } from "./components/smithy-sample-code";
import {
  SmithyBaseProject,
  SmithyBaseProjectOptions,
} from "./smithy-base-project";
import { SmithyProjectDefinition } from "./smithy-project-definition";
import {
  SmithyServiceProjectDefinition,
  SmithyServiceProjectDefinitionOptions,
} from "./smithy-service-project-definition";

/**
 * Options for the Smithy REST API model
 */
export interface SmithyModelProjectOptions
  extends SmithyBaseProjectOptions,
    SmithyServiceProjectDefinitionOptions,
    TypeSafeApiModelBuildOutputOptions {}

/**
 * Smithy model project for a REST API
 */
export class SmithyModelProject extends SmithyBaseProject {
  /**
   * Name of the API
   */
  public readonly apiName: string;
  /**
   * Smithy model and build settings
   */
  public readonly definition: SmithyServiceProjectDefinition;

  constructor(options: SmithyModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.definition = new SmithyServiceProjectDefinition(this, options);
    this.apiName = options.smithyOptions.serviceName.serviceName;

    const { namespace: serviceNamespace, serviceName } =
      options.smithyOptions.serviceName;
    const firstHandlerLanguage = options.handlerLanguages?.[0];

    // Create the default smithy model
    new SmithySampleCode(this, {
      modelDir: this.definition.modelDir,
      serviceName,
      serviceNamespace,
      firstHandlerLanguage,
    });

    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      smithyJsonModelPath: this.definition.smithyJsonModelPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.SMITHY,
      apiType: "rest",
    });
  }

  public smithyProjectDefinition(): SmithyProjectDefinition {
    return this.definition;
  }
}
