/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import * as readPkg from "read-pkg-up";
import { Language, Library } from "../../languages";
import { MockResponseDataGenerationOptions } from "../../types";

/**
 * Enum for generator directories for non-runtime generators
 */
export enum OtherGenerators {
  DOCS = "docs",
  // Infrastructure
  TYPESCRIPT_CDK_INFRASTRUCTURE = "typescript-cdk-infrastructure",
  PYTHON_CDK_INFRASTRUCTURE = "python-cdk-infrastructure",
  JAVA_CDK_INFRASTRUCTURE = "java-cdk-infrastructure",
  // Handlers
  TYPESCRIPT_LAMBDA_HANDLERS = "typescript-lambda-handlers",
  PYTHON_LAMBDA_HANDLERS = "python-lambda-handlers",
  JAVA_LAMBDA_HANDLERS = "java-lambda-handlers",
}

export enum TypeSafeApiScript {
  PARSE_OPENAPI_SPEC = "parse-openapi-spec",
  GENERATE = "generate",
  GENERATE_MOCK_DATA = "generate-mock-data",
  GENERATE_HTML_REDOC_DOCS = "generate-html-redoc-docs",
  CLEAN_OPENAPI_GENERATED_CODE = "clean-openapi-generated-code",
  COPY_GRADLE_WRAPPER = "copy-gradle-wrapper",
}

/**
 * Generator directory for openapi generation containing templates, config etc.
 */
export type GeneratorDirectory = Language | Library | OtherGenerators;

/**
 * Types of normalizers supported by openapi-generator
 * @see https://openapi-generator.tech/docs/customization/#openapi-normalizer
 */
export type OpenApiNormalizer = "KEEP_ONLY_FIRST_TAG_IN_OPERATION";

/**
 * Options for generating code or docs using OpenAPI Generator CLI
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
   * The path of the OpenAPI spec to generate code from
   */
  readonly specPath: string;
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
  /**
   * Vendor extensions to add for code generation, allowing custom properties to be passed to the generator templates
   * Keys should begin with "x-"
   */
  readonly extraVendorExtensions?: Record<string, string | boolean>;
  /**
   * Generate alias as model.
   * Defines whether "primitive types" defined at the model/schema level will be wrapped in a model (ie maps/lists)
   * @see https://openapi-generator.tech/docs/globals/
   * @default true
   */
  readonly generateAliasAsModel?: boolean;
  /**
   * The path to the json smithy model file, if available
   */
  readonly smithyJsonPath?: string;
}

/**
 * Build a command for running a script from this project's bin
 */
export const buildTypeSafeApiExecCommand = (
  script: TypeSafeApiScript,
  args?: string
) => {
  const { packageJson } = readPkg.sync({
    cwd: path.resolve(__dirname),
  })!;
  return `npx --yes -p aws-pdk@${packageJson.version} ${script}${
    args ? ` ${args}` : ""
  }`;
};

const serializeProperties = (properties: { [key: string]: string }) =>
  Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");

/**
 * Generate code or docs by invoking the root generate script
 */
export const buildInvokeOpenApiGeneratorCommandArgs = (
  options: GenerationOptions
): string => {
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

  const extensions = options.extraVendorExtensions
    ? ` --extra-vendor-extensions '${JSON.stringify(
        options.extraVendorExtensions
      )}'`
    : "";

  const generateAliasAsModel =
    options.generateAliasAsModel ?? true ? " --generate-alias-as-model" : "";

  const smithyJsonPath = options.smithyJsonPath
    ? ` --smithy-json-path ${options.smithyJsonPath}`
    : "";

  const specPath = options.specPath;
  const outputPath = ".";

  return `--generator ${options.generator} --spec-path ${specPath} --output-path ${outputPath} --generator-dir ${options.generatorDirectory} --src-dir ${srcDir}${smithyJsonPath}${additionalProperties}${normalizers}${extensions}${generateAliasAsModel}`;
};

/**
 * Builds a command to clean up files which were previously generated by openapi generator
 */
export const buildCleanOpenApiGeneratedCodeCommand = (): string => {
  return buildTypeSafeApiExecCommand(
    TypeSafeApiScript.CLEAN_OPENAPI_GENERATED_CODE,
    `--code-path .`
  );
};

/**
 * Options for generating mock data json files
 */
export interface MockDataGenerationOptions
  extends MockResponseDataGenerationOptions {
  /**
   * The path of the OpenAPI spec to generate data for
   */
  readonly specPath: string;
  /**
   * Output sub directory relative to the outdir in which to generate mock data
   * Mock data will be written to a directory named 'mocks' within the sub directory
   * @default .
   */
  readonly outputSubDir?: string;
}

/**
 * Invoke the mock data generator script
 */
export const buildInvokeMockDataGeneratorCommand = (
  options: MockDataGenerationOptions
): string => {
  const outputPath = options.outputSubDir ?? ".";
  const locale = options.locale ? ` --locale ${options.locale}` : "";
  const maxArrayLength =
    options.maxArrayLength !== undefined
      ? ` --max-array-length ${options.maxArrayLength}`
      : "";
  return buildTypeSafeApiExecCommand(
    TypeSafeApiScript.GENERATE_MOCK_DATA,
    `--spec-path ${options.specPath} --output-path ${outputPath}${locale}${maxArrayLength}`
  );
};
