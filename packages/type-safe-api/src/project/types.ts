/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { JavaProject, JavaProjectOptions } from "projen/lib/java";
import { PythonProject, PythonProjectOptions } from "projen/lib/python";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { SmithyBuildOptions } from "./model/smithy/types";

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
 * Options for generated clients
 */
export interface GeneratedCodeOptions {
  /**
   * Options for a generated typescript project. These override the default inferred options.
   */
  readonly typescript?: TypeScriptProjectOptions;
  /**
   * Options for a generated python project. These override the default inferred options.
   */
  readonly python?: PythonProjectOptions;
  /**
   * Options for a generated java project. These override the default inferred options.
   */
  readonly java?: JavaProjectOptions;
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
  readonly typescriptReactQueryHooks?: TypeScriptProjectOptions;
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
