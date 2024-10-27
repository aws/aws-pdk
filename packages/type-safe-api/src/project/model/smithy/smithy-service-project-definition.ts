/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project } from "projen";
import { SmithyAwsPdkPrelude } from "./components/smithy-aws-pdk-prelude";
import { SmithyProjectDefinition } from "./smithy-project-definition";
import { DEFAULT_SMITHY_VERSION } from "./version";
import { Language } from "../../languages";
import { SmithyModelOptions } from "../../types";

/**
 * Options for a smithy service project definition
 */
export interface SmithyServiceProjectDefinitionOptions {
  /**
   * Smithy engine options
   */
  readonly smithyOptions: SmithyModelOptions;
  /**
   * The languages users have specified for handler projects (if any)
   */
  readonly handlerLanguages?: Language[];
}

/**
 * Creates a project which defines a Smithy service, and transforms the Smithy model to OpenAPI
 */
export class SmithyServiceProjectDefinition extends SmithyProjectDefinition {
  /**
   * Path to the generated OpenAPI specification, relative to the project outdir
   */
  public readonly openApiSpecificationPath: string;

  /**
   * Path to the json Smithy model, relative to the project outdir
   */
  public readonly smithyJsonModelPath: string;

  /**
   * Directory of generated model source code
   */
  public readonly generatedModelDir: string;

  constructor(
    project: Project,
    options: SmithyServiceProjectDefinitionOptions
  ) {
    const { smithyOptions } = options;
    const { namespace: serviceNamespace, serviceName } =
      options.smithyOptions.serviceName;

    super(project, {
      ...options,
      smithyBuildOptions: {
        ...smithyOptions.smithyBuildOptions,
        projections: {
          // Add the openapi projection for generating the OpenAPI specification
          openapi: {
            ...smithyOptions.smithyBuildOptions?.projections?.openapi,
            plugins: {
              openapi: {
                service: `${serviceNamespace}#${serviceName}`,
                // By default, preserve tags in the generated spec, but allow users to explicitly overwrite this
                tags: true,
                // By default, use integer types as this is more intuitive when smithy distinguishes between Integers and Doubles.
                // Users may also override this.
                useIntegerType: true,
                ...smithyOptions.smithyBuildOptions?.projections?.openapi
                  ?.plugins?.openapi,
              },
            },
          },
        },
      },
    });

    // Always add the following additional required dependencies
    const requiredDependencies = [
      "software.amazon.smithy:smithy-openapi",
      "software.amazon.smithy:smithy-aws-traits",
    ];

    // Ensure dependencies always include the required dependencies, allowing users to customise the version
    const userSpecifiedDependencies =
      smithyOptions.smithyBuildOptions?.maven?.dependencies ?? [];
    const userSpecifiedDependencySet = new Set(
      userSpecifiedDependencies.map((dep) =>
        dep.split(":").slice(0, -1).join(":")
      )
    );

    this.addDeps(
      ...requiredDependencies
        .filter((requiredDep) => !userSpecifiedDependencySet.has(requiredDep))
        .map((dep) => `${dep}:${DEFAULT_SMITHY_VERSION}`),
      ...userSpecifiedDependencies
    );

    // Add the smithy prelude (managed by aws-pdk)
    this.generatedModelDir = path.join("generated", "main", "smithy");
    new SmithyAwsPdkPrelude(project, {
      generatedModelDir: this.generatedModelDir,
      serviceNamespace,
      handlerLanguages: options.handlerLanguages,
    });
    this.addSources(this.generatedModelDir);

    const projectionOutputPath = path.join(
      "build",
      "smithyprojections",
      this.gradleProjectName,
      "openapi"
    );
    this.openApiSpecificationPath = path.join(
      projectionOutputPath,
      "openapi",
      `${serviceName}.openapi.json`
    );
    this.smithyJsonModelPath = path.join(
      projectionOutputPath,
      "model",
      "model.json"
    );
  }
}
