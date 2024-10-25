/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Component, YamlFile } from "projen";
import { NodeProject } from "projen/lib/javascript";
import { TypeSpecAwsPdkPrelude } from "./components/type-spec-aws-pdk-prelude";
import { TypeSpecAwsPdkPreludeJs } from "./components/type-spec-aws-pdk-prelude-js";
import { GenerateTask } from "../../codegen/components/generate-task";
import { Language } from "../../languages";
import { TypeSpecModelOptions } from "../../types";

/**
 * Options for a TypeSpec model project
 */
export interface TypeSpecProjectDefinitionOptions {
  /**
   * TypeSpec model options
   */
  readonly typeSpecOptions: TypeSpecModelOptions;
  /**
   * The languages users have specified for handler projects (if any)
   */
  readonly handlerLanguages?: Language[];
}

/**
 * Creates a project which allows APIs to be defined in TypeSpec
 * @see https://typespec.io/
 */
export class TypeSpecProjectDefinition extends Component {
  /**
   * Path to the generated OpenAPI specification
   */
  public readonly openApiSpecificationPath: string;

  /**
   * Directory in which the model source resides
   */
  protected readonly modelDir: string = "src";

  /**
   * Directory in which generated model source resides
   */
  protected readonly generatedModelDir = "generated";

  constructor(project: NodeProject, options: TypeSpecProjectDefinitionOptions) {
    super(project);
    const { handlerLanguages } = options;

    // Add dependencies on the TypeSpec compiler and http/openapi libraries
    project.addDevDeps(
      "@typespec/compiler@^0.61",
      "@typespec/http@^0.61",
      "@typespec/openapi@^0.61",
      "@typespec/openapi3@^0.61"
    );

    const outputDir = "dist";
    const outputFile = "openapi.json";

    project.gitignore.addPatterns(outputDir);

    // Compiled output is located under a directory for the emitter we're using, in this case @typespec/openapi3
    this.openApiSpecificationPath = path.join(
      outputDir,
      "@typespec",
      "openapi3",
      outputFile
    );

    // Configuration for the typespec compiler
    new YamlFile(this, "tspconfig.yaml", {
      obj: {
        emit: ["@typespec/openapi3"],
        options: {
          "@typespec/openapi3": {
            "output-file": outputFile,
          },
        },
        "output-dir": path.join("{cwd}", outputDir),
      },
    });

    // Add the prelude which defines our custom @handler decorator
    new TypeSpecAwsPdkPrelude(project, {
      generatedModelDir: this.generatedModelDir,
      handlerLanguages,
    });
    new TypeSpecAwsPdkPreludeJs(project, {
      generatedModelDir: this.generatedModelDir,
    });

    const generateTask = GenerateTask.ensure(project);

    // In order for typespec to load our prelude javascript file(s), we need to ensure
    // it's treated as a module
    generateTask.env("NODE_OPTIONS", "--experimental-default-type=module");

    // Compile typespec to openapi
    generateTask.exec(`tsp compile ${this.modelDir} --config tspconfig.yaml`);
  }
}
