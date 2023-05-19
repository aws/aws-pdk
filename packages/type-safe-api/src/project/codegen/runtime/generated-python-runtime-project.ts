/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { PythonProject } from "projen/lib/python";
import { Language } from "../../languages";
import { GeneratedPythonProjectOptions } from "../../types";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommand,
} from "../components/utils";

/**
 * Configuration for the generated python types project
 */
export interface GeneratedPythonTypesProjectOptions
  extends GeneratedPythonProjectOptions {
  /**
   * The path to the OpenAPI specification, relative to this project's outdir
   */
  readonly specPath: string;
}

/**
 * Python project containing types generated using OpenAPI Generator CLI
 */
export class GeneratedPythonRuntimeProject extends PythonProject {
  /**
   * Patterns that are excluded from code generation
   */
  public static openApiIgnorePatterns: string[] = [
    "test",
    "test/*",
    "test/**/*",
    ".gitlab-ci.yml",
    ".travis.yml",
    "git_push.sh",
    "tox.ini",
    "requirements.txt",
    "test-requirements.txt",
    "setup.py",
    "setup.cfg",
  ];

  /**
   * Path to the openapi specification
   * @private
   */
  private readonly specPath: string;

  constructor(options: GeneratedPythonTypesProjectOptions) {
    super({
      sample: false,
      pytest: false,
      poetry: true,
      poetryOptions: {
        packages: [{ include: options.moduleName }],
        // Module must be explicitly added to include since poetry excludes everything in .gitignore by default
        include: [options.moduleName, `${options.moduleName}/**/*.py`],
      },
      ...options,
    });
    this.specPath = options.specPath;

    // Add dependencies required by the client
    [
      "certifi@^14.5.14",
      "frozendict@~2.3.4",
      "python-dateutil@~2.7.0",
      "setuptools@^21.0.0",
      "typing_extensions@~4.3.0",
      "urllib3@~1.26.7",
    ].forEach((dep) => this.addDependency(dep));

    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    openapiGeneratorIgnore.addPatterns(
      ...GeneratedPythonRuntimeProject.openApiIgnorePatterns
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    const generateCodeCommand = this.buildGenerateCommand();
    const cleanCommand = buildCleanOpenApiGeneratedCodeCommand(this.outdir);

    const generateTask = this.addTask("generate");
    generateTask.exec(cleanCommand.command, {
      cwd: path.relative(this.outdir, cleanCommand.workingDir),
    });
    generateTask.exec(generateCodeCommand.command, {
      cwd: path.relative(this.outdir, generateCodeCommand.workingDir),
    });

    this.preCompileTask.spawn(generateTask);

    // Ignore all the generated code
    this.gitignore.addPatterns(
      this.moduleName,
      "docs",
      "README.md",
      ".openapi-generator"
    );

    // The poetry install that runs as part of post synthesis expects there to be some code present, but code isn't
    // generated until build time. This means that the first install will fail when either generating the project for
    // the first time or checking out a fresh copy (since generated code is not checked in to version control). We
    // therefore add a blank __init__.py as our first install step to keep poetry happy until the generator overwrites
    // it.
    this.tasks
      .tryFind("install")
      ?.prependExec(
        `mkdir -p ${this.moduleName} && touch ${this.moduleName}/__init__.py`
      );
  }

  public buildGenerateCommand = () => {
    return buildInvokeOpenApiGeneratorCommand({
      generator: "python",
      specPath: this.specPath,
      outputPath: this.outdir,
      generatorDirectory: Language.PYTHON,
      additionalProperties: {
        packageName: this.moduleName,
        projectName: this.name,
      },
      // Tell the generator where python source files live
      srcDir: this.moduleName,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
    });
  };
}
