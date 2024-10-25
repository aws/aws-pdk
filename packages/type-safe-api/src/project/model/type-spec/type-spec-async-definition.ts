/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodeProject } from "projen/lib/javascript";
import { TypeSpecAsyncAwsPdkPrelude } from "./components/type-spec-async-aws-pdk-prelude";
import { TypeSpecAsyncAwsPdkPreludeJs } from "./components/type-spec-async-aws-pdk-prelude-js";
import { TypeSpecAsyncSampleCode } from "./components/type-spec-async-sample-code";
import {
  TypeSpecProjectDefinition,
  TypeSpecProjectDefinitionOptions,
} from "./type-spec-project-definition";

/**
 * Options for the TypeSpec async model definition
 */
export interface TypeSpecAsyncDefinitionOptions
  extends TypeSpecProjectDefinitionOptions {}

/**
 * The TypeSpec model definition for an async api
 */
export class TypeSpecAsyncDefinition extends TypeSpecProjectDefinition {
  constructor(project: NodeProject, options: TypeSpecAsyncDefinitionOptions) {
    super(project, options);

    // Add the async prelude files which define the @async, @connectHandler and @disconnectHandler decorators
    new TypeSpecAsyncAwsPdkPrelude(project, {
      generatedModelDir: this.generatedModelDir,
    });
    new TypeSpecAsyncAwsPdkPreludeJs(project, {
      generatedModelDir: this.generatedModelDir,
    });

    // Add the sample code for TypeSpec websocket APIs
    new TypeSpecAsyncSampleCode(project, {
      ...options,
      modelDir: this.modelDir,
    });
  }
}
