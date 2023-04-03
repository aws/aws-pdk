/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType } from "projen";
import { JavaProject, JavaProjectOptions } from "projen/lib/java";
import { Language } from "../../../languages";
import { buildGenerateCdkInfrastructureCommand } from "../../components/utils";
import { GeneratedJavaRuntimeProject } from "../../runtime/generated-java-runtime-project";

export interface GeneratedJavaCdkInfrastructureProjectOptions
  extends JavaProjectOptions {
  /**
   * OpenAPI spec path, relative to the project outdir
   */
  readonly specPath: string;
  /**
   * The generated java types
   */
  readonly generatedJavaTypes: GeneratedJavaRuntimeProject;
}

export class GeneratedJavaCdkInfrastructureProject extends JavaProject {
  /**
   * Path to the openapi specification
   * @private
   */
  private readonly specPath: string;

  /**
   * The generated java types
   * @private
   */
  private readonly generatedJavaTypes: GeneratedJavaRuntimeProject;

  constructor(options: GeneratedJavaCdkInfrastructureProjectOptions) {
    super({
      ...options,
      sample: false,
      junit: false,
    });
    this.specPath = options.specPath;
    this.generatedJavaTypes = options.generatedJavaTypes;

    [
      "software.aws.awsprototypingsdk/type-safe-api@^0",
      "software.constructs/constructs@^10",
      "software.amazon.awscdk/aws-cdk-lib@^2",
      "io.github.cdklabs/cdknag@^2",
      "org.projectlombok/lombok@^1",
      "com.fasterxml.jackson.core/jackson-databind@^2",
      "io.github.cdklabs/projen@^0",
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

    const generateInfraCommand = this.buildGenerateCommand();

    const generateTask = this.addTask("generate");
    generateTask.exec(generateInfraCommand.command, {
      cwd: path.relative(this.outdir, generateInfraCommand.workingDir),
    });

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns("src");
  }

  public buildGenerateCommand = () => {
    const infraPackage = `${this.pom.groupId}.${this.name}.infra`;

    const relativeSourcePathParts = [
      "src",
      "main",
      "java",
      ...infraPackage.split("."),
    ];

    return buildGenerateCdkInfrastructureCommand({
      language: Language.JAVA,
      sourcePath: path.join(this.outdir, ...relativeSourcePathParts),
      resourcePath: path.join(this.outdir, "src", "main", "resources"),
      generatedTypesPackage: this.generatedJavaTypes.packageName,
      infraPackage,
      // Spec path relative to the source directory
      specPath: path.join(
        ...relativeSourcePathParts.map(() => ".."),
        this.specPath
      ),
    });
  };
}
