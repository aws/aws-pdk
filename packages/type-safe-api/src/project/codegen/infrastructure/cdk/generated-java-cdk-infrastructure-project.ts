/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType } from "projen";
import { JavaProject } from "projen/lib/java";
import {
  GeneratedJavaInfrastructureOptions,
  MockResponseDataGenerationOptions,
} from "../../../types";
import { OpenApiGeneratorIgnoreFile } from "../../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeMockDataGeneratorCommand,
  buildInvokeOpenApiGeneratorCommand,
  OtherGenerators,
} from "../../components/utils";
import { GeneratedJavaRuntimeProject } from "../../runtime/generated-java-runtime-project";

export interface GeneratedJavaCdkInfrastructureProjectOptions
  extends GeneratedJavaInfrastructureOptions {
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

  /**
   * Mock data generator options
   * @private
   */
  private readonly mockDataOptions?: MockResponseDataGenerationOptions;

  constructor(options: GeneratedJavaCdkInfrastructureProjectOptions) {
    super({
      ...options,
      sample: false,
      junit: false,
    });
    this.specPath = options.specPath;
    this.generatedJavaTypes = options.generatedJavaTypes;
    this.mockDataOptions = options.mockDataOptions;
    this.packageName = `${this.pom.groupId}.${this.name}.infra`;
    this.srcDir = path.join(
      "src",
      "main",
      "java",
      ...this.packageName.split(".")
    );

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

    // Ignore everything but the target files
    const openapiGeneratorIgnore = new OpenApiGeneratorIgnoreFile(this);
    openapiGeneratorIgnore.addPatterns(
      "/*",
      "**/*",
      "*",
      `!${this.srcDir}/Api.java`,
      `!${this.srcDir}/ApiProps.java`,
      `!${this.srcDir}/MockIntegrations.java`
    );

    // Add OpenAPI Generator cli configuration
    OpenApiToolsJsonFile.ensure(this).addOpenApiGeneratorCliConfig(
      options.openApiGeneratorCliConfig
    );

    const generateInfraCommand = this.buildGenerateCommand();
    const cleanCommand = buildCleanOpenApiGeneratedCodeCommand(this.outdir);
    const mockDataCommand = this.buildGenerateMockDataCommand();

    const generateTask = this.addTask("generate");
    generateTask.exec(cleanCommand.command, {
      cwd: path.relative(this.outdir, cleanCommand.workingDir),
    });
    generateTask.exec(generateInfraCommand.command, {
      cwd: path.relative(this.outdir, generateInfraCommand.workingDir),
    });
    // Copy the parsed spec into the resources directory so that it's included in the jar
    generateTask.exec("mkdir -p src/main/resources");
    generateTask.exec(`cp -f ${this.specPath} src/main/resources/.api.json`);
    generateTask.exec(mockDataCommand.command, {
      cwd: path.relative(this.outdir, mockDataCommand.workingDir),
    });

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns("src", ".openapi-generator");
  }

  public buildGenerateCommand = () => {
    return buildInvokeOpenApiGeneratorCommand({
      generator: "java",
      specPath: this.specPath,
      outputPath: this.outdir,
      generatorDirectory: OtherGenerators.JAVA_CDK_INFRASTRUCTURE,
      srcDir: this.srcDir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-infrastructure-package": this.packageName,
        "x-runtime-package": this.generatedJavaTypes.packageName,
      },
      // Do not generate map/list types. Generator will use built in HashMap, ArrayList instead
      generateAliasAsModel: false,
    });
  };

  public buildGenerateMockDataCommand = () => {
    return buildInvokeMockDataGeneratorCommand({
      specPath: this.specPath,
      outdir: this.outdir,
      // Write the mocks to the resources directory
      outputSubDir: "src/main/resources",
      ...this.mockDataOptions,
    });
  };
}
