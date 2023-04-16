/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { DependencyType, Project, SampleDir } from "projen";
import { JavaProject, JavaProjectOptions } from "projen/lib/java";
import { ClientSettings } from "./codegen/components/client-settings";
import { DocsProject } from "./codegen/docs-project";
import { generateClientProjects } from "./codegen/generate";
import { GeneratedJavaClientProject } from "./codegen/generated-java-client-project";
import { ClientLanguage } from "./languages";
import { getJavaSampleSource, JavaSampleCodeOptions } from "./samples/java";
import { OpenApiSpecProject } from "./spec/open-api-spec-project";
import { OpenApiGatewayProjectOptions } from "./types";

const OPENAPI_GATEWAY_PDK_PACKAGE_NAME =
  "software.aws.awsprototypingsdk/open-api-gateway@^0";

/**
 * Configuration for the OpenApiGatewayJavaProject
 */
export interface OpenApiGatewayJavaProjectOptions
  extends JavaProjectOptions,
    OpenApiGatewayProjectOptions {}

/**
 * Synthesizes a Java Project with an OpenAPI spec, generated clients, a CDK construct for deploying the API
 * with API Gateway, and generated lambda handler wrappers for type-safe handling of requests.
 *
 * @pjid open-api-gateway-java
 * @deprecated Please use TypeSafeApiProject instead. This will be removed in the PDK GA 1.0 release.
 */
export class OpenApiGatewayJavaProject extends JavaProject {
  /**
   * A reference to the generated java client
   */
  public readonly generatedJavaClient: JavaProject;

  /**
   * References to the client projects that were generated, keyed by language
   */
  public readonly generatedClients: { [language: string]: Project };

  /**
   * The directory in which the OpenAPI spec file(s) reside, relative to the project srcdir
   */
  public readonly specDir: string;

  /**
   * The directory in which the api generated code will reside, relative to the project srcdir. This will also be used
   * as the package for the api project.
   */
  public readonly apiSrcDir: string;

  /**
   * The name of the spec file
   */
  public readonly specFileName: string;

  /**
   * The directory in which generated client code will be generated, relative to the outdir of this project
   */
  public readonly generatedCodeDir: string;

  /**
   * Force to generate code and docs even if there were no changes in spec
   */
  public readonly forceGenerateCodeAndDocs?: boolean;

  private readonly hasParent: boolean;

  constructor(projectOptions: OpenApiGatewayJavaProjectOptions) {
    super({
      ...projectOptions,
      sample: false,
    });

    const options = this.preConstruct(projectOptions);

    if (options.specFile && !path.isAbsolute(options.specFile)) {
      this.specDir = path.dirname(options.specFile);
      this.specFileName = path.basename(options.specFile);
    } else {
      this.specDir = "spec";
      this.specFileName = "spec.yaml";
    }
    this.generatedCodeDir = options.generatedCodeDir ?? "generated";
    this.forceGenerateCodeAndDocs = options.forceGenerateCodeAndDocs ?? false;
    this.apiSrcDir = options.apiSrcDir ?? "api";

    // Generated project should have a dependency on this project, in order to run the generation scripts
    [
      OPENAPI_GATEWAY_PDK_PACKAGE_NAME,
      "software.constructs/constructs@^10",
      "software.amazon.awscdk/aws-cdk-lib@^2",
      "io.github.cdklabs/cdknag@^2",
      "org.projectlombok/lombok@^1",
      "com.fasterxml.jackson.core/jackson-databind@^2",
      "io.github.cdklabs/projen@^0",
    ]
      .filter(
        (dep) =>
          !this.deps.tryGetDependency(dep.split("@")[0], DependencyType.RUNTIME)
      )
      .forEach((dep) => this.addDependency(dep));

    // Remove the projen test dependency since otherwise it takes precedence, causing projen to be unavailable at synth time
    this.deps.removeDependency("io.github.cdklabs/projen", DependencyType.TEST);

    // Synthesize the openapi spec early since it's used by the generated java client, which is also synth'd early
    const spec = new OpenApiSpecProject({
      name: `${this.name}-spec`,
      parent: this,
      outdir: path.join("src", this.specDir),
      // Write the parsed spec to the resources directory so that it can be packaged into the jar
      parsedSpecOutdir: path.join(
        ...this.specDir.split("/").map(() => ".."),
        "main",
        "resources",
        this.specDir
      ),
      specFileName: this.specFileName,
      parsedSpecFileName: options.parsedSpecFileName,
      ...(options.specFile && path.isAbsolute(options.specFile)
        ? {
            overrideSpecPath: options.specFile,
          }
        : {}),
    });
    spec.synth();

    // Parent the generated code with this project's parent for better integration with monorepos
    this.hasParent = !!options.parent;
    const generatedCodeDirRelativeToParent = this.hasParent
      ? path.join(options.outdir!, this.generatedCodeDir)
      : this.generatedCodeDir;

    // Always generate the java client since this project will take a dependency on it in order to produce the
    // type-safe cdk construct wrapper.
    const clientLanguages = new Set(options.clientLanguages);
    clientLanguages.add(ClientLanguage.JAVA);

    const clientSettings = new ClientSettings(this, {
      clientLanguages: [...clientLanguages],
      defaultClientLanguage: ClientLanguage.JAVA,
      documentationFormats: options.documentationFormats ?? [],
      forceGenerateCodeAndDocs: this.forceGenerateCodeAndDocs,
      generatedCodeDir: this.generatedCodeDir,
      specChanged: spec.specChanged,
    });

    this.generatedClients = generateClientProjects(
      clientSettings.clientLanguageConfigs,
      {
        parent: this.hasParent ? options.parent! : this,
        parentPackageName: this.name,
        generatedCodeDir: generatedCodeDirRelativeToParent,
        parsedSpecPath: spec.parsedSpecPath,
        typescriptOptions: {
          defaultReleaseBranch: "main",
          ...options.typescriptClientOptions,
        },
        pythonOptions: {
          authorName: "APJ Cope",
          authorEmail: "apj-cope@amazon.com",
          version: "0.0.0",
          ...options.pythonClientOptions,
        },
        javaOptions: {
          version: "0.0.0",
          ...options.javaClientOptions,
        },
      }
    );

    this.generatedJavaClient = this.generatedClients[
      ClientLanguage.JAVA
    ] as GeneratedJavaClientProject;

    // Synth early so that the generated code is available prior to this project's install phase
    this.generatedJavaClient.synth();

    // Add a dependency on the generated java client
    this.addDependency(
      `${this.generatedJavaClient.pom.groupId}/${this.generatedJavaClient.pom.artifactId}@${this.generatedJavaClient.pom.version}`
    );

    // Add a dependency on the generated java client repository
    this.pom.addRepository({
      url: `file://./${this.generatedCodeDir}/${ClientLanguage.JAVA}/dist/java`,
      id: "generated-java-api-client",
    });

    if (this.hasParent) {
      // Since the generated java client project is parented by this project's parent rather than this project,
      // projen will clean up the generated client when synthesizing this project unless we add an explicit exclude.
      this.addExcludeFromCleanup(`${this.generatedCodeDir}/**/*`);

      if ("addImplicitDependency" in this.parent!) {
        // If we're within a monorepo, add an implicit dependency to ensure the generated java client is built first
        (this.parent! as any).addImplicitDependency(
          this,
          this.generatedJavaClient
        );
      }
    }

    // We build this project as a super jar so that it can be deployed as a lambda. This isn't ideal for jar size and
    // so is not the recommended approach, however is makes it possible for a "one-click" way to get started with a
    // full hello world api. Included in the generated "SampleApi.java" is a comment encouraging users to read the
    // README and to move to defining a separate package for lambda handlers.
    this.pom.addPlugin("org.apache.maven.plugins/maven-shade-plugin@3.3.0", {
      configuration: {
        createDependencyReducedPom: false,
        // Name is the same as the regular maven build jar, which ensures the api jar path resolves to the super jar
        // for deployment as a lambda.
        finalName: `${this.name}-${options.version}`,
      },
      executions: [
        {
          id: "shade-task",
          phase: "package",
          goals: ["shade"],
        },
      ],
    });

    const javaClientPackage = `${this.generatedJavaClient.pom.groupId}.${this.generatedJavaClient.name}.client`;

    // Generate the sample source code
    const sampleOptions: JavaSampleCodeOptions = {
      openApiGatewayPackageName: OPENAPI_GATEWAY_PDK_PACKAGE_NAME,
      sampleCode: options.sample ?? true, // Generate sample code by default
      apiSrcDir: this.apiSrcDir,
      specDir: this.specDir,
      parsedSpecFileName: spec.parsedSpecFileName,
      javaClientPackage,
    };

    new SampleDir(this, path.join("src", "main", "java", this.apiSrcDir), {
      files: getJavaSampleSource(sampleOptions),
    });

    // Generate documentation if needed
    new DocsProject({
      parent: this,
      outdir: path.join(this.generatedCodeDir, "documentation"),
      name: "docs",
      formatConfigs: clientSettings.documentationFormatConfigs,
      specPath: spec.parsedSpecPath,
    });
  }

  /**
   * This method provides inheritors a chance to synthesize extra resources prior to those created by this project.
   * Return any options you wish to change, other than java project options.
   */
  protected preConstruct(
    options: OpenApiGatewayJavaProjectOptions
  ): OpenApiGatewayJavaProjectOptions {
    return options;
  }
}
