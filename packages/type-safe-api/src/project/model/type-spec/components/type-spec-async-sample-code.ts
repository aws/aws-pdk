/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project, SampleDir } from "projen";
import { TypeSpecDefinitionOptions } from "../type-spec-definition";

/**
 * Options for TypeSpec sample code
 */
export interface TypeSpecAsyncSampleCodeOptions
  extends TypeSpecDefinitionOptions {
  /**
   * Location for the TypeSpec model
   */
  readonly modelDir: string;
}

/**
 * Defines sample code for a TypeSpec REST API
 */
export class TypeSpecAsyncSampleCode extends SampleDir {
  constructor(
    project: Project,
    {
      modelDir,
      typeSpecOptions,
      handlerLanguages,
    }: TypeSpecAsyncSampleCodeOptions
  ) {
    const firstHandlerLanguage = handlerLanguages?.[0];

    super(project, modelDir, {
      files: {
        "main.tsp": `import "@typespec/openapi";
import "@typespec/openapi3";
import "../generated/aws-pdk/prelude.tsp";
import "../generated/aws-pdk/async.tsp";

using OpenAPI;

/**
 * A sample TypeSpec api
 */
@service({
  title: "${typeSpecOptions.namespace}",
})
@info({
  version: "1.0",
})
${
  firstHandlerLanguage
    ? `@connectHandler({ language: "${firstHandlerLanguage}" })
@disconnectHandler({ language: "${firstHandlerLanguage}" })
`
    : ""
}namespace ${typeSpecOptions.namespace};

${
  firstHandlerLanguage
    ? `@handler({ language: "${firstHandlerLanguage}" })
`
    : ""
}@async({ direction: "client_to_server" })
op SubscribeToNotifications(
  topic: string,
): void;

@async({ direction: "server_to_client" })
op SendNotification(
  topic: string,
  title: string,
  message: string,
): void;
`,
      },
    });
  }
}
