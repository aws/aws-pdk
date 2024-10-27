/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { SmithyShapeLibrarySampleCode } from "./components/smithy-shape-library-sample-code";
import {
  SmithyBaseProject,
  SmithyBaseProjectOptions,
} from "./smithy-base-project";
import {
  SmithyProjectDefinition,
  SmithyProjectDefinitionOptions,
} from "./smithy-project-definition";
import { GenerateTask } from "../../codegen/components/generate-task";
import { TypeSafeApiCommandEnvironment } from "../../codegen/components/type-safe-api-command-environment";

/**
 * Options for the Smithy shape library
 */
export interface SmithyShapeLibraryProjectOptions
  extends SmithyBaseProjectOptions,
    SmithyProjectDefinitionOptions {}

/**
 * A project for defining a library of Smithy shapes which can be consumed by other projects
 */
export class SmithyShapeLibraryProject extends SmithyBaseProject {
  /**
   * Smithy model and build settings
   */
  public readonly definition: SmithyProjectDefinition;

  constructor(options: SmithyShapeLibraryProjectOptions) {
    super(options);
    TypeSafeApiCommandEnvironment.ensure(this);

    this.definition = new SmithyProjectDefinition(this, options);

    this.compileTask.spawn(GenerateTask.ensure(this));

    new SmithyShapeLibrarySampleCode(this, {
      modelDir: this.definition.modelDir,
      // Namespace here is just rendered into sample code and user is free to edit
      namespace: "com.example",
    });
  }

  public smithyProjectDefinition(): SmithyProjectDefinition {
    return this.definition;
  }
}
