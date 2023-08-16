/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType } from "projen";
import { JavaProject } from "projen/lib/java";
import {
  CodeGenerationSourceOptions,
  GeneratedJavaHandlersOptions,
} from "../../types";
import { OpenApiGeneratorHandlebarsIgnoreFile } from "../components/open-api-generator-handlebars-ignore-file";
import { OpenApiGeneratorIgnoreFile } from "../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  OtherGenerators,
  TypeSafeApiScript,
} from "../components/utils";
import { GeneratedJavaRuntimeProject } from "../runtime/generated-java-runtime-project";

export interface GeneratedJavaHandlersProjectOptions
  extends GeneratedJavaHandlersOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated java types
   */
  readonly generatedJavaTypes: GeneratedJavaRuntimeProject;
}

export class GeneratedJavaHandlersProject extends JavaProject {
  /**
   * Options configured for the project
   * @private
   */
  private readonly options: GeneratedJavaHandlersProjectOptions;

  /**
   * Source directory
   * @private
   */
  private readonly srcDir: string;

  /**
   * Java package name
   * @private
   */
  private readonly packageName: string;

  constructor(options: GeneratedJavaHandlersProjectOptions) {
    super({
      ...options,
      sample: false,
      junit: false,
    });
    this.options = options;
    this.packageName = `${this.pom.groupId}.${this.name}.handlers`;
    this.srcDir = path.join(
      "src",
      "main",
      "java",
      ...this.packageName.split(".")
    );

    [
      `${options.generatedJavaTypes.pom.groupId}/${options.generatedJavaTypes.pom.artifactId}@${options.generatedJavaTypes.pom.version}`,
    ]
      .filter(
        (dep) =>
          !this.deps.tryGetDependency(dep.split("@")[0], DependencyType.RUNTIME)
      )
      .forEach((dep) => this.addDependency(dep));

    // Remove the projen test dependency since otherwise it takes precedence, causing projen to be unavailable at synth time
    this.deps.removeDependency("io.github.cdklabs/projen", DependencyType.TEST);

    // Add a dependency on the generated java types repository
    this.pom.addRepository({
      url: `file://${path.relative(
        this.outdir,
        options.generatedJavaTypes.outdir
      )}/dist/java`,
      id: `${options.generatedJavaTypes.pom.groupId}-${options.generatedJavaTypes.pom.artifactId}-repo`,
    });

    // Ignore everything for the first mustache pass
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    openapiGeneratorIgnore.addPatterns("/*", "**/*", "*");
    // Ignore everything but the handler files for the handlebars pass
    const openapiGeneratorHandlebarsIgnore =
      new OpenApiGeneratorHandlebarsIgnoreFile(this);
    openapiGeneratorHandlebarsIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      // This will be split into a file per targeted handler
      `!${this.srcDir}/__all_handlers.java`
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    const generateTask = this.addTask("generate");
    generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );

    this.preCompileTask.spawn(generateTask);

    // Ignore the openapi generator metadata files
    this.gitignore.addPatterns(".openapi-generator");

    // Use the maven shade plugin to build a "super jar" which we can deploy to AWS Lambda
    this.pom.addPlugin("org.apache.maven.plugins/maven-shade-plugin@3.3.0", {
      configuration: {
        createDependencyReducedPom: false,
      },
      executions: [
        {
          id: "shade-task",
          phase: "package",
          goals: ["shade"],
        },
      ],
    });
  }

  public buildGenerateCommandArgs = () => {
    return buildInvokeOpenApiGeneratorCommandArgs({
      generator: "java",
      specPath: this.options.specPath,
      smithyJsonPath: this.options.smithyJsonModelPath,
      generatorDirectory: OtherGenerators.JAVA_LAMBDA_HANDLERS,
      srcDir: this.srcDir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-handlers-package": this.packageName,
        "x-runtime-package": this.options.generatedJavaTypes.packageName,
      },
      // Do not generate map/list types. Generator will use built in HashMap, ArrayList instead
      generateAliasAsModel: false,
    });
  };
}