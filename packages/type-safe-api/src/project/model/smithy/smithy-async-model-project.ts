/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { TypeSafeApiCommandEnvironment } from "../../codegen/components/type-safe-api-command-environment";
import { ModelLanguage } from "../../types";
import { ModelReadme } from "../model-readme";
import {
  TypeSafeApiAsyncModelBuild,
  TypeSafeApiAsyncModelBuildOutputOptions,
} from "../type-safe-api-async-model-build";
import {
  TypeSafeApiModelBuild,
  TypeSafeApiModelBuildOutputOptions,
} from "../type-safe-api-model-build";
import { SmithyAsyncSampleCode } from "./components/smithy-async-sample-code";
import { SmithyAwsPdkAsyncPrelude } from "./components/smithy-aws-pdk-async-prelude";
import {
  SmithyBaseProject,
  SmithyBaseProjectOptions,
} from "./smithy-base-project";
import { SmithyProjectDefinition } from "./smithy-project-definition";
import {
  SmithyServiceProjectDefinition,
  SmithyServiceProjectDefinitionOptions,
} from "./smithy-service-project-definition";
import { GenerateTask } from "../../codegen/components/generate-task";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../../codegen/components/utils";

/**
 * Options for the Smithy WebSocket API model project
 */
export interface SmithyAsyncModelProjectOptions
  extends SmithyBaseProjectOptions,
    SmithyServiceProjectDefinitionOptions,
    TypeSafeApiModelBuildOutputOptions,
    TypeSafeApiAsyncModelBuildOutputOptions {}

/**
 * Smithy model project for a WebSocket API
 */
export class SmithyAsyncModelProject extends SmithyBaseProject {
  /**
   * Name of the API
   */
  public readonly apiName: string;
  /**
   * Smithy model and build settings
   */
  public readonly definition: SmithyServiceProjectDefinition;

  constructor(options: SmithyAsyncModelProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.definition = new SmithyServiceProjectDefinition(this, {
      ...options,
      smithyOptions: {
        ...options.smithyOptions,
        smithyBuildOptions: {
          ...options.smithyOptions.smithyBuildOptions,
          projections: {
            ...options.smithyOptions.smithyBuildOptions?.projections,
            openapi: {
              ...options.smithyOptions.smithyBuildOptions?.projections?.openapi,
              transforms: [
                // Add the async transform to the openapi projection
                { name: "aws-pdk-async-transformer", args: {} },
              ],
            },
          },
        },
      },
    });
    this.apiName = options.smithyOptions.serviceName.serviceName;

    const { namespace: serviceNamespace, serviceName } =
      options.smithyOptions.serviceName;
    const firstHandlerLanguage = options.handlerLanguages?.[0];

    // Create the default smithy model
    new SmithyAsyncSampleCode(this, {
      modelDir: this.definition.modelDir,
      serviceName,
      serviceNamespace,
      firstHandlerLanguage,
    });

    // Add the additional async prelude
    new SmithyAwsPdkAsyncPrelude(this, {
      generatedModelDir: this.definition.generatedModelDir,
      serviceNamespace,
      handlerLanguages: options.handlerLanguages,
    });

    const generateTask = GenerateTask.ensure(this);

    // Copy the async transformer jar
    generateTask.prependExec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.COPY_ASYNC_SMITHY_TRANSFORMER
      )
    );

    this.definition.addDeps(
      `file://.smithy-async/aws-pdk-smithy-async-transformer.jar`
    );
    this.gitignore.addPatterns(".smithy-async");

    new TypeSafeApiModelBuild(this, {
      openApiSpecificationPath: this.definition.openApiSpecificationPath,
      smithyJsonModelPath: this.definition.smithyJsonModelPath,
      parsedSpecFile: options.parsedSpecFile,
    });

    new TypeSafeApiAsyncModelBuild(this, {
      parsedSpecFile: options.parsedSpecFile,
      asyncApiSpecFile: options.asyncApiSpecFile,
    });

    new ModelReadme(this, {
      modelLanguage: ModelLanguage.SMITHY,
      apiType: "async",
    });
  }

  public smithyProjectDefinition(): SmithyProjectDefinition {
    return this.definition;
  }
}
