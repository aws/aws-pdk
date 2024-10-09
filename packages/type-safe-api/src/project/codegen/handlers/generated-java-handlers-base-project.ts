/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, SampleDir } from "projen";
import { JavaProject } from "projen/lib/java";
import { JavaVersion } from "../../languages";
import {
  CodeGenerationSourceOptions,
  GeneratedJavaHandlersOptions,
} from "../../types";
import { TypeSafeApiCommandEnvironment } from "../components/type-safe-api-command-environment";
import {
  buildCodegenCommandArgs,
  buildTypeSafeApiExecCommand,
  CodegenOptions,
  TypeSafeApiScript,
} from "../components/utils";
import { GeneratedJavaRuntimeBaseProject } from "../runtime/generated-java-runtime-base-project";
import { RuntimeVersionUtils } from "../runtime-version-utils";

export interface GeneratedJavaHandlersBaseProjectOptions
  extends GeneratedJavaHandlersOptions,
    CodeGenerationSourceOptions {
  /**
   * The generated java types
   */
  readonly generatedJavaTypes: GeneratedJavaRuntimeBaseProject;
}

export abstract class GeneratedJavaHandlersBaseProject extends JavaProject {
  /**
   * Options configured for the project
   */
  protected readonly options: GeneratedJavaHandlersBaseProjectOptions;

  /**
   * Source directory
   */
  protected readonly srcDir: string;

  /**
   * Test directory
   */
  protected readonly tstDir: string;

  /**
   * Java package name
   */
  public readonly packageName: string;

  /**
   * Java runtime version for the handlers
   */
  public readonly runtimeVersion: JavaVersion;

  constructor(options: GeneratedJavaHandlersBaseProjectOptions) {
    super({
      sample: false,
      junit: false,
      compileOptions: RuntimeVersionUtils.JAVA.getMavenCompileOptions(
        options.runtimeVersion
      ),
      ...(options as any),
    });
    TypeSafeApiCommandEnvironment.ensure(this);
    this.options = options;
    this.runtimeVersion = options.runtimeVersion ?? JavaVersion.JAVA_17;
    this.packageName = `${this.pom.groupId}.${this.name}.handlers`;
    this.srcDir = path.join(
      "src",
      "main",
      "java",
      ...this.packageName.split(".")
    );
    this.tstDir = path.join(
      "src",
      "test",
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

    // Pin constructs version
    this.deps.removeDependency(
      "software.constructs/constructs",
      DependencyType.BUILD
    );
    this.addDependency("software.constructs/constructs@10.3.0");

    // Dependency on junit for tests
    this.deps.addDependency(
      "org.junit.jupiter/junit-jupiter-engine@5.10.2",
      DependencyType.TEST
    );

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
    generateTask.exec(
      buildTypeSafeApiExecCommand(
        TypeSafeApiScript.GENERATE_NEXT,
        this.buildGenerateCommandArgs()
      )
    );

    this.preCompileTask.spawn(generateTask);

    // Ignore the openapi generator metadata files
    this.gitignore.addPatterns(".openapi-generator", ".tsapi-manifest");

    // Use the maven shade plugin to build a "super jar" which we can deploy to AWS Lambda
    this.pom.addPlugin("org.apache.maven.plugins/maven-shade-plugin@3.3.0", {
      configuration: {
        createDependencyReducedPom: false,
        transformers: [
          {
            // Transformer required for merging log4j2 plugins cache file
            // https://docs.aws.amazon.com/lambda/latest/dg/java-logging.html#java-logging-cdk
            transformer: {
              "@implementation":
                "com.github.edwgiz.maven_shade_plugin.log4j2_cache_transformer.PluginsCacheFileTransformer",
            },
          },
        ],
      },
      executions: [
        {
          id: "shade-task",
          phase: "package",
          goals: ["shade"],
        },
      ],
      dependencies: [
        "com.github.edwgiz/maven-shade-plugin.log4j2-cachefile-transformer@2.15.0",
      ],
    });

    // Use the maven surefire plugin to run junit tests
    this.pom.addPlugin("org.apache.maven.plugins/maven-surefire-plugin@3.2.1");

    // Log4j2 configuration for powertools logger
    new SampleDir(this, "src/main/resources", {
      files: {
        "log4j2.xml": `<?xml version="1.0" encoding="UTF-8"?>
<Configuration>
    <Appenders>
        <Console name="JsonAppender" target="SYSTEM_OUT">
            <JsonTemplateLayout eventTemplateUri="classpath:LambdaJsonLayout.json" />
        </Console>
    </Appenders>
    <Loggers>
        <Logger name="JsonLogger" level="INFO" additivity="false">
            <AppenderRef ref="JsonAppender"/>
        </Logger>
        <Root level="info">
            <AppenderRef ref="JsonAppender"/>
        </Root>
    </Loggers>
</Configuration>`,
      },
    });
  }

  public buildGenerateCommandArgs = () => {
    return buildCodegenCommandArgs(this.buildCodegenOptions());
  };

  public abstract buildCodegenOptions(): CodegenOptions;
}
