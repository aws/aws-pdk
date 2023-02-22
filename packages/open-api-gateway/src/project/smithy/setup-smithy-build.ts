/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Project } from "projen";
import { SmithyBuildProject } from "./smithy-build-project";
import { SmithyApiGatewayProjectOptions } from "../types";

/**
 * Result from setting up a smithy based project
 */
export interface SmithyBuildProjectResult {
  /**
   * Path to the generated OpenAPI spec to use as input for an OpenApiGateway<Language>Project
   */
  readonly generatedSpecFilePath: string;
}

/**
 * Adds the common subprojects for building a Smithy model into an OpenAPI spec
 */
export const setupSmithyBuild = (
  project: Project,
  options: SmithyApiGatewayProjectOptions
): SmithyBuildProjectResult => {
  const { serviceName } = options.serviceName;

  const smithyBuildDir = "smithy";
  const smithyBuildOutputSubDir = "output";

  // Create the smithy build project, responsible for transforming the model into an OpenAPI spec
  const smithyBuild = new SmithyBuildProject({
    name: `${project.name}-smithy-build`,
    parent: project,
    outdir: smithyBuildDir,
    serviceName: options.serviceName,
    smithyBuildOptions: options.smithyBuildOptions,
    buildOutputDir: smithyBuildOutputSubDir,
  });
  smithyBuild.synth();

  const smithyBuildOutputDir = path.join(
    smithyBuildDir,
    smithyBuildOutputSubDir
  );

  // Ignore smithy build output by default
  if (options.ignoreSmithyBuildOutput ?? true) {
    project.gitignore.addPatterns(smithyBuildOutputDir);
  }
  // Ignore gradle wrapper by default
  if (options.ignoreGradleWrapper ?? true) {
    project.gitignore.addPatterns(path.join(smithyBuildDir, "gradle"));
    project.gitignore.addPatterns(path.join(smithyBuildDir, "gradlew"));
    project.gitignore.addPatterns(path.join(smithyBuildDir, "gradlew.bat"));
  }
  // Ignore the .gradle directory
  project.gitignore.addPatterns(path.join(smithyBuildDir, ".gradle"));
  project.gitignore.addPatterns(path.join(smithyBuildDir, "build"));

  return {
    // Generated spec is written to output/<projection id>/<plugin id>/<service name>.openapi.json
    generatedSpecFilePath: path.join(
      smithyBuild.smithyBuildOutputPath,
      "openapi",
      "openapi",
      `${serviceName}.openapi.json`
    ),
  };
};
