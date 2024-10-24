/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { SmithyAsyncSampleCode } from "./components/smithy-async-sample-code";
import { SmithyAwsPdkAsyncPrelude } from "./components/smithy-aws-pdk-async-prelude";
import {
  SmithyProjectDefinition,
  SmithyProjectDefinitionOptions,
} from "./smithy-project-definition";
import { GenerateTask } from "../../codegen/components/generate-task";
import {
  TypeSafeApiScript,
  buildTypeSafeApiExecCommand,
} from "../../codegen/components/utils";

/**
 * Options for a smithy build project
 */
export interface SmithyAsyncDefinitionOptions
  extends SmithyProjectDefinitionOptions {}

/**
 * Creates a project which transforms a Smithy model for an async API to OpenAPI
 */
export class SmithyAsyncDefinition extends SmithyProjectDefinition {
  constructor(project: Project, options: SmithyAsyncDefinitionOptions) {
    super(project, {
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

    const { namespace: serviceNamespace, serviceName } =
      options.smithyOptions.serviceName;
    const firstHandlerLanguage = options.handlerLanguages?.[0];

    // Create the default smithy model
    new SmithyAsyncSampleCode(project, {
      modelDir: this.modelDir,
      serviceName,
      serviceNamespace,
      firstHandlerLanguage,
    });

    // Add the additional async prelude
    new SmithyAwsPdkAsyncPrelude(project, {
      generatedModelDir: this.generatedModelDir,
      serviceNamespace,
      handlerLanguages: options.handlerLanguages,
    });

    const generateTask = GenerateTask.ensure(project);

    // Copy the async transformer jar
    generateTask.prependExec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.COPY_ASYNC_SMITHY_TRANSFORMER
      )
    );

    this.addDeps(`file://.smithy-async/aws-pdk-smithy-async-transformer.jar`);
    project.gitignore.addPatterns(".smithy-async");
  }
}
