/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Project } from "projen";
import { JavaProject } from "projen/lib/java";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import { JavaProjectOptions } from "./java-project-options";
import { SmithyBuildOptions } from "./model/smithy/types";
import { PythonProjectOptions } from "./python-project-options";
import { TypeScriptProjectOptions } from "./typescript-project-options";

/**
 * The model definition language
 */
export enum ModelLanguage {
  /**
   * Smithy
   * @see https://smithy.io/2.0/
   */
  SMITHY = "SMITHY",
  /**
   * OpenAPI
   * @see https://www.openapis.org/
   */
  OPENAPI = "OPENAPI",
}

/**
 * Options for a Smithy model
 */
export interface SmithyModelOptions {
  /**
   * Smithy service name
   */
  readonly serviceName: SmithyServiceName;
  /**
   * Smithy build options
   */
  readonly smithyBuildOptions?: SmithyBuildOptions;
  /**
   * Set to false if you would like to check in your smithy build output or have more fine-grained control over what is
   * checked in, eg if you add other projections to the smithy-build.json file.
   * @default true
   */
  readonly ignoreSmithyBuildOutput?: boolean;
  /**
   * Set to false if you would like to check in your gradle wrapper. Do so if you would like to use a different version
   * of gradle to the one provided by default
   * @default true
   */
  readonly ignoreGradleWrapper?: boolean;
}

/**
 * Options for the OpenAPI model
 */
export interface OpenApiModelOptions {
  /**
   * The title in the OpenAPI specification
   */
  readonly title: string;
}

/**
 * Options for models
 */
export interface ModelOptions {
  /**
   * Options for the Smithy model - required when model language is SMITHY
   */
  readonly smithy?: SmithyModelOptions;

  /**
   * Options for the OpenAPI model - required when model language is OPENAPI
   */
  readonly openapi?: OpenApiModelOptions;
}

/**
 * Maven repository info for fetching the OpenAPI Generator jar
 * @see https://github.com/OpenAPITools/openapi-generator-cli#using-custom--private-maven-registry
 */
export interface OpenApiGeneratorCliConfigRepository {
  /**
   * Maven repository URL for downloading the OpenAPI Generator jar.
   * This must specify the full url, and can include placeholders for the groupId, artifactId and versionName.
   * For example: https://private.maven.intern/maven2/${groupId}/${artifactId}/${versionName}/${artifactId}-${versionName}.jar
   * @see https://github.com/OpenAPITools/openapi-generator-cli#using-custom--private-maven-registry
   */
  readonly downloadUrl: string;
}

/**
 * Configuration for the OpenAPI Generator CLI
 * @see https://github.com/OpenAPITools/openapi-generator-cli#configuration
 */
export interface OpenApiGeneratorCliConfig {
  /**
   * OpenAPI Generator version to use. Edit with caution - using the non-default
   * version may result in broken generated code.
   * @default 6.3.0
   */
  readonly version?: string;
  /**
   * The directory in which OpenAPI Generator jars are cached
   * @default ~/.open-api-generator-cli
   */
  readonly storageDir?: string;
  /**
   * Maven repository info for fetching the OpenAPI Generator jar
   * @see https://github.com/OpenAPITools/openapi-generator-cli#using-custom--private-maven-registry
   * @default public maven repository
   */
  readonly repository?: OpenApiGeneratorCliConfigRepository;
  /**
   * Use docker instead of your locally installed Java version
   * @see https://github.com/OpenAPITools/openapi-generator-cli#use-docker-instead-of-running-java-locally
   * @default false
   */
  readonly useDocker?: boolean;
}

/**
 * Options for a code project generated with OpenAPI Generator
 */
export interface GeneratedWithOpenApiGeneratorOptions {
  /**
   * Configuration for the OpenAPI Generator CLI. Overrides default values if specified.
   * @see https://github.com/OpenAPITools/openapi-generator-cli#configuration
   */
  readonly openApiGeneratorCliConfig?: OpenApiGeneratorCliConfig;
}

/**
 * Options for configuring a generated typescript runtime project
 */
export interface GeneratedTypeScriptRuntimeOptions
  extends TypeScriptProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for configuring a generated python runtime project
 */
export interface GeneratedPythonRuntimeOptions
  extends PythonProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for configuring a generated java runtime project
 */
export interface GeneratedJavaRuntimeOptions
  extends JavaProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for generating mock data
 */
export interface MockResponseDataGenerationOptions {
  /**
   * Set to true to disable generating mock data
   * @default false
   */
  readonly disable?: boolean;
  /**
   * Locale of generated data
   * @see https://fakerjs.dev/guide/localization.html#available-locales
   * @default en
   */
  readonly locale?: string;
  /**
   * Maximum length of generated arrays
   * @default 3
   */
  readonly maxArrayLength?: number;
}

/**
 * Options for generating mock data
 */
export interface MockResponseGenerationOptions {
  /**
   * Options for the generated mock response data
   */
  readonly mockDataOptions?: MockResponseDataGenerationOptions;
}

/**
 * Options for configuring a generated typescript infrastructure project
 */
export interface GeneratedTypeScriptInfrastructureOptions
  extends TypeScriptProjectOptions,
    GeneratedWithOpenApiGeneratorOptions,
    MockResponseGenerationOptions {}

/**
 * Options for configuring a generated python infrastructure project
 */
export interface GeneratedPythonInfrastructureOptions
  extends PythonProjectOptions,
    GeneratedWithOpenApiGeneratorOptions,
    MockResponseGenerationOptions {}

/**
 * Options for configuring a generated java infrastructure project
 */
export interface GeneratedJavaInfrastructureOptions
  extends JavaProjectOptions,
    GeneratedWithOpenApiGeneratorOptions,
    MockResponseGenerationOptions {}

/**
 * Options for configuring a generated typescript handlers project
 */
export interface GeneratedTypeScriptHandlersOptions
  extends TypeScriptProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {
  /**
   * Globs for lambda handler entry points, used by esbuild
   * @default src/*.ts - all files directly under the src directory
   */
  readonly handlerEntryPoints?: string[];
}

/**
 * Options for configuring a generated python handlers project
 */
export interface GeneratedPythonHandlersOptions
  extends PythonProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for configuring a generated java handlers project
 */
export interface GeneratedJavaHandlersOptions
  extends JavaProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for configuring a generated typescript hooks library project
 */
export interface GeneratedTypeScriptReactQueryHooksOptions
  extends TypeScriptProjectOptions,
    GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for generated runtimes
 */
export interface GeneratedRuntimeCodeOptions {
  /**
   * Options for a generated typescript project. These override the default inferred options.
   */
  readonly typescript?: GeneratedTypeScriptRuntimeOptions;
  /**
   * Options for a generated python project. These override the default inferred options.
   */
  readonly python?: GeneratedPythonRuntimeOptions;
  /**
   * Options for a generated java project. These override the default inferred options.
   */
  readonly java?: GeneratedJavaRuntimeOptions;
}

/**
 * Options for generated infrastructure
 */
export interface GeneratedInfrastructureCodeOptions {
  /**
   * Options for the generated typescript infrastructure project. These override the default inferred options.
   */
  readonly typescript?: GeneratedTypeScriptInfrastructureOptions;
  /**
   * Options for the generated python infrastructure project. These override the default inferred options.
   */
  readonly python?: GeneratedPythonInfrastructureOptions;
  /**
   * Options for the generated java infrastructure project. These override the default inferred options.
   */
  readonly java?: GeneratedJavaInfrastructureOptions;
}

/**
 * Options for lambda handler projects for implementing API operations
 */
export interface GeneratedHandlersCodeOptions {
  /**
   * Options for the typescript handlers project. These override the default inferred options.
   */
  readonly typescript?: GeneratedTypeScriptHandlersOptions;
  /**
   * Options for the python handlers project. These override the default inferred options.
   */
  readonly python?: GeneratedPythonHandlersOptions;
  /**
   * Options for the java handlers project. These override the default inferred options.
   */
  readonly java?: GeneratedJavaHandlersOptions;
}

/**
 * Collections of projects managed by type-safe-api
 */
export interface ProjectCollections {
  /**
   * Array of all projects managed by type-safe-api
   */
  readonly projects: Project[];
  /**
   * Array of all model projects
   */
  readonly model: Project[];
  /**
   * Array of all runtime projects
   */
  readonly runtimes: Project[];
  /**
   * Array of all infrastructure projects
   */
  readonly infrastructure: Project[];
  /**
   * Array of all library projects
   */
  readonly libraries: Project[];
  /**
   * Array of all documentation projects
   */
  readonly documentation: Project[];
  /**
   * Array of all handler projects
   */
  readonly handlers: Project[];
}

/**
 * Generated code projects
 */
export interface GeneratedCodeProjects {
  /**
   * Generated typescript project
   */
  readonly typescript?: TypeScriptProject;
  /**
   * Generated python project
   */
  readonly python?: PythonProject;
  /**
   * Generated java project
   */
  readonly java?: JavaProject;
}

/**
 * Options for generated libraries
 */
export interface GeneratedLibraryOptions {
  /**
   * Options for the generated typescript react-query hooks library. These override the default inferred options.
   */
  readonly typescriptReactQueryHooks?: GeneratedTypeScriptReactQueryHooksOptions;
}

/**
 * Generated library projects
 */
export interface GeneratedLibraryProjects {
  /**
   * Generated typescript react-query hooks project
   */
  readonly typescriptReactQueryHooks?: TypeScriptProject;
}

/**
 * Options for the html redoc documentation project
 */
export interface GeneratedHtmlRedocDocumentationOptions
  extends GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for the html2 documentation project
 */
export interface GeneratedHtml2DocumentationOptions
  extends GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for the markdown documentation project
 */
export interface GeneratedMarkdownDocumentationOptions
  extends GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for the plantuml documentation project
 */
export interface GeneratedPlantumlDocumentationOptions
  extends GeneratedWithOpenApiGeneratorOptions {}

/**
 * Options for generated documentation projects
 */
export interface GeneratedDocumentationOptions {
  /**
   * Generated html redoc documentation project options
   */
  readonly htmlRedoc?: GeneratedHtmlRedocDocumentationOptions;
  /**
   * Generated html2 documentation project options
   */
  readonly html2?: GeneratedHtml2DocumentationOptions;
  /**
   * Generated markdown documentation project options
   */
  readonly markdown?: GeneratedMarkdownDocumentationOptions;
  /**
   * Generated plantuml documentation project options
   */
  readonly plantuml?: GeneratedPlantumlDocumentationOptions;
}

/**
 * Generated documentation project references
 */
export interface GeneratedDocumentationProjects {
  /**
   * Generated html redoc documentation project
   */
  readonly htmlRedoc?: Project;
  /**
   * Generated html2 documentation project
   */
  readonly html2?: Project;
  /**
   * Generated markdown documentation project
   */
  readonly markdown?: Project;
  /**
   * Generated plantuml documentation project
   */
  readonly plantuml?: Project;
}

/**
 * Represents a fully qualified name of a Smithy service.
 * @see https://awslabs.github.io/smithy/2.0/spec/service-types.html
 */
export interface SmithyServiceName {
  /**
   * The service namespace. Nested namespaces are separated by '.', for example com.company
   * @see https://awslabs.github.io/smithy/2.0/spec/model.html#shape-id
   */
  readonly namespace: string;
  /**
   * The service name. Should be PascalCase, for example HelloService
   * @see https://awslabs.github.io/smithy/2.0/spec/model.html#shape-id
   */
  readonly serviceName: string;
}

/**
 * Options for the source files used for code generation
 */
export interface CodeGenerationSourceOptions {
  /**
   * Path to the OpenAPI specification
   */
  readonly specPath: string;
}
