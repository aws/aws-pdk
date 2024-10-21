/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { ProjectUtils } from "@aws/monorepo";
import { DependencyType, Task } from "projen";
import { JavaProject, JavaProjectOptions } from "projen/lib/java";
import {
  CodeGenerationSourceOptions,
  GeneratedWithOpenApiGeneratorOptions,
} from "../../../types";
import { TypeSafeApiCommandEnvironment } from "../../components/type-safe-api-command-environment";
import {
  buildCodegenCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  TypeSafeApiScript,
} from "../../components/utils";
import { GeneratedHandlersProjects } from "../../generate";
import { GeneratedJavaRuntimeBaseProject } from "../../runtime/generated-java-runtime-base-project";

export interface GeneratedJavaInfrastructureBaseOptions
  extends JavaProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

export interface GeneratedJavaCdkInfrastructureBaseProjectOptions
  extends GeneratedJavaInfrastructureBaseOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated java types
   */
  readonly generatedJavaTypes: GeneratedJavaRuntimeBaseProject;
  /**
   * Generated handlers projects
   */
  readonly generatedHandlers: GeneratedHandlersProjects;
}

export abstract class GeneratedJavaCdkInfrastructureBaseProject extends JavaProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedJavaCdkInfrastructureBaseProjectOptions;

  /**
   * Source directory
   */
  protected readonly srcDir: string;

  /**
   * Java package name
   */
  protected readonly packageName: string;

  /**
   * Code generation task
   */
  protected readonly generateTask: Task;

  constructor(options: GeneratedJavaCdkInfrastructureBaseProjectOptions) {
    super({
      ...options,
      sample: false,
      junit: false,
    });
    TypeSafeApiCommandEnvironment.ensure(this);

    this.options = options;
    this.packageName = `${this.pom.groupId}.${this.name}.infra`;
    this.srcDir = path.join(
      "src",
      "main",
      "java",
      ...this.packageName.split(".")
    );

    [
      `software.aws/pdk@${ProjectUtils.getPdkVersion()}`,
      "software.constructs/constructs@10.3.0",
      "software.amazon.awscdk/aws-cdk-lib@2.133.0",
      "io.github.cdklabs/cdknag@2.28.60",
      "org.projectlombok/lombok@1.18.30",
      "com.fasterxml.jackson.core/jackson-databind@2.17.0",
      `io.github.cdklabs/projen@0.80.10`,
      `${options.generatedJavaTypes.pom.groupId}/${options.generatedJavaTypes.pom.artifactId}@${options.generatedJavaTypes.pom.version}`,
    ]
      .filter(
        (dep) =>
          !this.deps.tryGetDependency(dep.split("@")[0], DependencyType.RUNTIME)
      )
      .forEach((dep) => this.addDependency(dep));

    // Pin constructs version
    this.deps.removeDependency(
      "software.constructs/constructs",
      DependencyType.BUILD
    );
    this.addDependency("software.constructs/constructs@10.3.0");

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

    const generateTask = this.addTask("generate");
    this.generateTask = generateTask;
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE_NEXT,
        this.buildGenerateCommandArgs()
      )
    );
    // Copy the parsed spec into the resources directory so that it's included in the jar
    generateTask.exec("mkdir -p src/main/resources");
    generateTask.exec(
      `cp -f ${this.options.specPath} src/main/resources/.api.json`
    );
    // Absolute path of this project is required for determining the path to the handlers jar,
    // since java executes from the jar which could be anywhere in the filesystem (eg the .m2 directory).
    // While ugly, since this is written at build time and not checked in it remains portable.
    generateTask.exec(
      "echo $(pwd) > src/main/resources/project-absolute-path.txt"
    );

    this.gitignore.addPatterns(".tsapi-manifest", ".openapi-generator");

    this.preCompileTask.spawn(generateTask);
  }

  public buildGenerateCommandArgs = () => {
    return buildCodegenCommandArgs(this.buildCodegenOptions());
  };

  protected abstract buildCodegenOptions(): CodegenOptions;
}
