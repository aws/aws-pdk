/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project, ProjectOptions, SampleFile, Task } from "projen";
import { OpenApiDefinition } from "./openapi/open-api-definition";
import { SmithyDefinition } from "./smithy/smithy-definition";
import { ModelLanguage, ModelOptions } from "../types";

export interface TypeSafeApiModelProjectOptions extends ProjectOptions {
  readonly modelLanguage: ModelLanguage;
  readonly modelOptions: ModelOptions;
}

export class TypeSafeApiModelProject extends Project {
  public readonly parsedSpecFile: string = ".api.json";
  public readonly generateTask: Task;

  constructor(options: TypeSafeApiModelProjectOptions) {
    super(options);

    this.generateTask = this.addTask("generate");

    // Add the API definition
    const openApiSpecificationPath = this.addApiDefinition(
      options.modelLanguage,
      options.modelOptions
    );

    // Parse and bundle the openapi specification
    this.addParseAndBundleTask(openApiSpecificationPath);

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

  private addApiDefinition = (
    modelLanguage: ModelLanguage,
    modelOptions: ModelOptions
  ): string => {
    if (modelLanguage === ModelLanguage.SMITHY) {
      if (!modelOptions.smithy) {
        throw new Error(
          `modelOptions.smithy is required when selected model language is ${ModelLanguage.SMITHY}`
        );
      }

      const smithyOptions = modelOptions.smithy;
      const smithyDefinition = new SmithyDefinition(this, {
        smithyOptions,
        buildOutputDir: "smithy-output",
      });

      return smithyDefinition.openApiSpecificationPath;
    } else if (modelLanguage === ModelLanguage.OPENAPI) {
      if (!modelOptions.openapi) {
        throw new Error(
          `modelOptions.openapi is required when selected model language is ${ModelLanguage.OPENAPI}`
        );
      }

      const openApiOptions = modelOptions.openapi;
      const openApiDefinition = new OpenApiDefinition(this, {
        openApiOptions,
      });
      return openApiDefinition.openApiSpecificationPath;
    } else {
      throw new Error(`Unknown model language ${modelLanguage}`);
    }
  };

  private addParseAndBundleTask = (openApiSpecificationPath: string) => {
    const absoluteSpecParserDir = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "scripts",
      "parser"
    );
    const absoluteOpenApiSpecificationPath = path.join(
      this.outdir,
      openApiSpecificationPath
    );
    const absoluteParsedSpecOutputPath = path.join(
      this.outdir,
      this.parsedSpecFile
    );

    const specPathRelativeToParserDir = path.relative(
      absoluteSpecParserDir,
      absoluteOpenApiSpecificationPath
    );
    const outputPathRelativeToParserDir = path.relative(
      absoluteSpecParserDir,
      absoluteParsedSpecOutputPath
    );

    this.generateTask.exec(
      `./parse-openapi-spec --spec-path ${specPathRelativeToParserDir} --output-path ${outputPathRelativeToParserDir}`,
      {
        cwd: path.relative(this.outdir, absoluteSpecParserDir),
      }
    );

    this.addGitIgnore(this.parsedSpecFile);
  };
}
