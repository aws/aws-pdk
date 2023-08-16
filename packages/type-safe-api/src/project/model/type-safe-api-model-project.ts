/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, ProjectOptions, SampleFile, Task } from "projen";
import { OpenApiDefinition } from "./openapi/open-api-definition";
import { SmithyDefinition } from "./smithy/smithy-definition";
import {
  buildTypeSafeApiExecCommand,
  TypeSafeApiScript,
} from "../codegen/components/utils";
import { Language } from "../languages";
import { ModelLanguage, ModelOptions } from "../types";

export interface TypeSafeApiModelProjectOptions extends ProjectOptions {
  /**
   * Language the model is defined in
   */
  readonly modelLanguage: ModelLanguage;
  /**
   * Options for the model
   */
  readonly modelOptions: ModelOptions;
  /**
   * The languages users have specified for handler projects (if any)
   */
  readonly handlerLanguages?: Language[];
}

export class TypeSafeApiModelProject extends Project {
  /**
   * Name of the final bundled OpenAPI specification
   */
  public readonly parsedSpecFile: string = ".api.json";
  /**
   * Reference to the task used for generating the final bundled OpenAPI specification
   */
  public readonly generateTask: Task;

  /**
   * Reference to the Smithy definition component. Will be defined if the model language is Smithy
   */
  public readonly smithy?: SmithyDefinition;

  /**
   * Reference to the OpenAPI definition component. Will be defined if the model language is OpenAPI
   */
  public readonly openapi?: OpenApiDefinition;

  constructor(options: TypeSafeApiModelProjectOptions) {
    super(options);

    this.generateTask = this.addTask("generate");

    // Add the API definition
    const { specPath, smithy, openapi } = this.addApiDefinition(options);
    this.smithy = smithy;
    this.openapi = openapi;

    // Parse and bundle the openapi specification
    this.addParseAndBundleTask(specPath);

    // Run the generate task as part of build
    this.compileTask.spawn(this.generateTask);

    // Add the README as a sample file which the user may edit
    new SampleFile(this, "README.md", {
      sourcePath: path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "samples",
        "readme",
        "model",
        `${options.modelLanguage}.md`
      ),
    });
  }

  private addApiDefinition = ({
    modelLanguage,
    modelOptions,
    handlerLanguages,
  }: TypeSafeApiModelProjectOptions) => {
    if (modelLanguage === ModelLanguage.SMITHY) {
      if (!modelOptions.smithy) {
        throw new Error(
          `modelOptions.smithy is required when selected model language is ${ModelLanguage.SMITHY}`
        );
      }

      const smithyOptions = modelOptions.smithy;
      const smithy = new SmithyDefinition(this, {
        smithyOptions,
        handlerLanguages,
      });

      return { smithy, specPath: smithy.openApiSpecificationPath };
    } else if (modelLanguage === ModelLanguage.OPENAPI) {
      if (!modelOptions.openapi) {
        throw new Error(
          `modelOptions.openapi is required when selected model language is ${ModelLanguage.OPENAPI}`
        );
      }

      const openApiOptions = modelOptions.openapi;
      const openapi = new OpenApiDefinition(this, {
        openApiOptions,
        handlerLanguages,
      });
      return { openapi, specPath: openapi.openApiSpecificationPath };
    } else {
      throw new Error(`Unknown model language ${modelLanguage}`);
    }
  };

  private addParseAndBundleTask = (openApiSpecificationPath: string) => {
    this.generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.PARSE_OPENAPI_SPEC,
        `--spec-path ${openApiSpecificationPath} --output-path ${this.parsedSpecFile}`
      )
    );

    this.addGitIgnore(this.parsedSpecFile);
  };
}
