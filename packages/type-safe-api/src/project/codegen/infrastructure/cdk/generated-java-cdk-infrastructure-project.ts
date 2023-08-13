/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType } from "projen";
import { JavaProject } from "projen/lib/java";
import {
  CodeGenerationSourceOptions,
  GeneratedJavaInfrastructureOptions,
} from "../../../types";
import { OpenApiGeneratorIgnoreFile } from "../../components/open-api-generator-ignore-file";
import { OpenApiToolsJsonFile } from "../../components/open-api-tools-json-file";
import {
  buildCleanOpenApiGeneratedCodeCommand,
  buildInvokeMockDataGeneratorCommand,
  buildInvokeOpenApiGeneratorCommandArgs,
  buildTypeSafeApiExecCommand,
  OtherGenerators,
  TypeSafeApiScript,
} from "../../components/utils";
import { GeneratedJavaRuntimeProject } from "../../runtime/generated-java-runtime-project";

export interface GeneratedJavaCdkInfrastructureProjectOptions
  extends GeneratedJavaInfrastructureOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated java types
   */
  readonly generatedJavaTypes: GeneratedJavaRuntimeProject;
}

export class GeneratedJavaCdkInfrastructureProject extends JavaProject {
  /**
   * Options configured for the project
   * @private
   */
  private readonly options: GeneratedJavaCdkInfrastructureProjectOptions;

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

  constructor(options: GeneratedJavaCdkInfrastructureProjectOptions) {
    super({
      ...options,
      sample: false,
      junit: false,
    });
    this.options = options;
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

    const generateTask = this.addTask("generate");
    generateTask.exec(buildCleanOpenApiGeneratedCodeCommand());
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE,
        this.buildGenerateCommandArgs()
      )
    );
    // Copy the parsed spec into the resources directory so that it's included in the jar
    generateTask.exec("mkdir -p src/main/resources");
    generateTask.exec(
      `cp -f ${this.options.specPath} src/main/resources/.api.json`
    );
    if (!this.options.mockDataOptions?.disable) {
      generateTask.exec(this.buildGenerateMockDataCommand());
    }

    this.preCompileTask.spawn(generateTask);

    // Ignore the generated code
    this.gitignore.addPatterns("src", ".openapi-generator");
  }

  public buildGenerateCommandArgs = () => {
    return buildInvokeOpenApiGeneratorCommandArgs({
      generator: "java",
      specPath: this.options.specPath,
      smithyJsonPath: this.options.smithyJsonModelPath,
      generatorDirectory: OtherGenerators.JAVA_CDK_INFRASTRUCTURE,
      srcDir: this.srcDir,
      normalizers: {
        KEEP_ONLY_FIRST_TAG_IN_OPERATION: true,
      },
      extraVendorExtensions: {
        "x-infrastructure-package": this.packageName,
        "x-runtime-package": this.options.generatedJavaTypes.packageName,
        // Enable mock integration generation by default
        "x-enable-mock-integrations": !this.options.mockDataOptions?.disable,
      },
      // Do not generate map/list types. Generator will use built in HashMap, ArrayList instead
      generateAliasAsModel: false,
    });
  };

  public buildGenerateMockDataCommand = (): string => {
    return buildInvokeMockDataGeneratorCommand({
      specPath: this.options.specPath,
      // Write the mocks to the resources directory
      outputSubDir: "src/main/resources",
      ...this.options.mockDataOptions,
    });
  };
}
