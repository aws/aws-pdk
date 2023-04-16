/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { Language } from "../../languages";

/**
 * Enum for generator directories for non-client generators
 */
export enum NonClientGeneratorDirectory {
  DOCS = "docs",
}

/**
 * Generator directory for openapi generation containing templates, config etc.
 */
export type GeneratorDirectory = Language | NonClientGeneratorDirectory;

/**
 * Types of normalizers supported by openapi-generator
 * @see https://openapi-generator.tech/docs/customization/#openapi-normalizer
 */
export type OpenApiNormalizer = "KEEP_ONLY_FIRST_TAG_IN_OPERATION";

/**
 * Options for generating client code or docs using OpenAPI Generator CLI
 */
export interface GenerationOptions {
  /**
   * The OpenAPI generator to use to generate the code/docs
   */
  readonly generator: string;
  /**
   * The directory to use for OpenAPI generation
   */
  readonly generatorDirectory: GeneratorDirectory;
  /**
   * The path of the OpenAPI spec to generate the client for
   */
  readonly specPath: string;
  /**
   * The directory in which the generated code should be output
   */
  readonly outputPath: string;
  /**
   * Additional properties to pass to the generate cli
   */
  readonly additionalProperties?: {
    [key: string]: string;
  };
  /**
   * Supply the relative path from the code project root to the source code directory in which custom generated files
   * (eg. operation config) should be placed.
   */
  readonly srcDir?: string;
  /**
   * Normalizers to apply to the spec prior to generation, if any
   * @see https://openapi-generator.tech/docs/customization/#openapi-normalizer
   */
  readonly normalizers?: Partial<Record<OpenApiNormalizer, boolean>>;
}

const serializeProperties = (properties: { [key: string]: string }) =>
  Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");

export interface CommandDetails {
  readonly command: string;
  readonly workingDir: string;
}

/**
 * Generate client code or docs by invoking the root generate script
 */
export const buildInvokeOpenApiGeneratorCommand = (
  options: GenerationOptions
): CommandDetails => {
  const srcDir = options.srcDir ?? "src";
  const additionalProperties = options.additionalProperties
    ? ` --additional-properties "${serializeProperties(
        options.additionalProperties
      )}"`
    : "";

  const normalizers = options.normalizers
    ? ` --openapi-normalizer "${serializeProperties(
        Object.fromEntries(
          Object.entries(options.normalizers).map(([k, v]) => [k, `${v}`])
        )
      )}"`
    : "";

  const workingDir = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "scripts",
    "generators"
  );
  const specPath = path.relative(
    workingDir,
    path.join(options.outputPath, options.specPath)
  );
  const outputPath = path.relative(workingDir, options.outputPath);

  return {
    command: `./generate --generator ${options.generator} --spec-path ${specPath} --output-path ${outputPath} --generator-dir ${options.generatorDirectory} --src-dir ${srcDir}${additionalProperties}${normalizers}`,
    workingDir,
  };
};

export const buildCleanOpenApiGeneratedCodeCommand = (
  outdir: string
): CommandDetails => {
  const workingDir = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "scripts",
    "custom",
    "clean-openapi-generated-code"
  );
  const codePath = path.relative(workingDir, outdir);

  return {
    command: `./clean-openapi-generated-code --code-path ${codePath}`,
    workingDir,
  };
};

/**
 * Options for generating documentation via a custom generator script
 */
export interface CustomDocsGenerationOptions {
  /**
   * Name of the generator script which exists in scripts/custom/docs
   */
  readonly generator: string;
  /**
   * The path of the OpenAPI spec to generate the client for
   */
  readonly specPath: string;
  /**
   * The directory in which the generated code should be output
   */
  readonly outputPath: string;
}

/**
 * Invoke a custom documentation generator script
 */
export const buildInvokeCustomDocsGeneratorCommand = (
  options: CustomDocsGenerationOptions
): CommandDetails => {
  const workingDir = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "scripts",
    "custom",
    "docs"
  );
  const specPath = path.relative(
    workingDir,
    path.join(options.outputPath, options.specPath)
  );
  const outputPath = path.relative(workingDir, options.outputPath);

  return {
    command: `./${options.generator} --spec-path ${specPath} --output-path ${outputPath}`,
    workingDir,
  };
};

export interface GenerateCdkInfrastructureOptions {
  /**
   * Path to the openapi specification, relative to the source path
   */
  readonly specPath: string;
  /**
   * Absolute path to the source directory of the package in which to generate the cdk infrastructure
   */
  readonly sourcePath: string;
  /**
   * Absolute path to the resources directory of the package in which to generate resources (java only)
   */
  readonly resourcePath?: string;
  /**
   * Language to generate cdk infrastructure in
   */
  readonly language: Language;
  /**
   * Package name for the cdk infrastructure
   */
  readonly infraPackage: string;
  /**
   * Generated types package name for importing the generated types
   */
  readonly generatedTypesPackage: string;
}

export const buildGenerateCdkInfrastructureCommand = (
  options: GenerateCdkInfrastructureOptions
): CommandDetails => {
  const workingDir = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "scripts",
    "custom",
    "infrastructure",
    "cdk"
  );

  const specPath = path.relative(
    workingDir,
    path.join(options.sourcePath, options.specPath)
  );
  const sourcePath = path.relative(workingDir, options.sourcePath);
  const resourcesPath = options.resourcePath
    ? path.relative(workingDir, options.resourcePath)
    : undefined;

  return {
    command: `./generate-type-safe-cdk-construct --spec-path ${specPath} --source-path ${sourcePath} --language ${
      options.language
    } --infra-package ${options.infraPackage} --generated-types-package ${
      options.generatedTypesPackage
    }${resourcesPath ? ` --resource-path ${resourcesPath}` : ""}`,
    workingDir,
  };
};
