/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodeProject } from "projen/lib/javascript";
import { TypeSpecSampleCode } from "./components/type-spec-sample-code";
import {
  TypeSpecProjectDefinition,
  TypeSpecProjectDefinitionOptions,
} from "./type-spec-project-definition";

/**
 * Options for the TypeSpec model definition
 */
export interface TypeSpecDefinitionOptions
  extends TypeSpecProjectDefinitionOptions {}

/**
 * The TypeSpec model definition
 */
export class TypeSpecDefinition extends TypeSpecProjectDefinition {
  constructor(project: NodeProject, options: TypeSpecDefinitionOptions) {
    super(project, options);

    new TypeSpecSampleCode(project, {
      ...options,
      modelDir: this.modelDir,
    });
  }
}
