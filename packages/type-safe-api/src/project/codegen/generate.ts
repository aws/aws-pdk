/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { getLogger } from "log4js";
import { Project, TextFile } from "projen";
import { GeneratedHtmlRedocDocumentationProject } from "./documentation/generated-html-redoc-documentation-project";
import { GeneratedHtml2DocumentationProject } from "./documentation/generated-html2-documentation-project";
import { GeneratedMarkdownDocumentationProject } from "./documentation/generated-markdown-documentation-project";
import { GeneratedPlantumlDocumentationProject } from "./documentation/generated-plantuml-documentation-project";
import { GeneratedJavaCdkInfrastructureProject } from "./infrastructure/cdk/generated-java-cdk-infrastructure-project";
import { GeneratedPythonCdkInfrastructureProject } from "./infrastructure/cdk/generated-python-cdk-infrastructure-project";
import { GeneratedTypescriptCdkInfrastructureProject } from "./infrastructure/cdk/generated-typescript-cdk-infrastructure-project";
import { TypescriptReactQueryHooksLibrary } from "./library/typescript-react-query-hooks-library";
import {
  GeneratedJavaRuntimeProject,
  GeneratedJavaTypesProjectOptions,
} from "./runtime/generated-java-runtime-project";
import {
  GeneratedPythonRuntimeProject,
  GeneratedPythonTypesProjectOptions,
} from "./runtime/generated-python-runtime-project";
import {
  GeneratedTypescriptRuntimeProject,
  GeneratedTypescriptTypesProjectOptions,
} from "./runtime/generated-typescript-runtime-project";
import { DocumentationFormat, Language, Library } from "../languages";

const logger = getLogger();

// Some options that we'll infer automatically for each client project, unless overridden
type CommonProjectOptions =
  | "artifactId"
  | "generateClient"
  | "groupId"
  | "moduleName"
  | "name"
  | "outdir"
  | "specPath";

export interface GenerateProjectsOptions {
  /**
   * The parent project for the generated types
   */
  readonly parent: Project;
  /**
   * Whether the infrastructure and types projects are parented by an nx-monorepo or not
   */
  readonly isWithinMonorepo?: boolean;
  /**
   * The name of the api package, used to infer package names unless overrides are specified
   */
  readonly parentPackageName: string;
  /**
   * The directory in which to generate code for all packages
   */
  readonly generatedCodeDir: string;
  /**
   * Path to the parsed spec file
   * We use the parsed spec such that refs are resolved to support multi-file specs
   */
  readonly parsedSpecPath: string;
}

/**
 * Options for generating types
 */
export interface GenerateRuntimeProjectsOptions
  extends GenerateProjectsOptions {
  /**
   * Options for the typescript project.
   * These will override any inferred properties (such as the package name).
   */
  readonly typescriptOptions: Omit<
    GeneratedTypescriptTypesProjectOptions,
    CommonProjectOptions
  >;
  /**
   * Options for the python project
   * These will override any inferred properties (such as the package name).
   */
  readonly pythonOptions: Omit<
    GeneratedPythonTypesProjectOptions,
    CommonProjectOptions
  >;
  /**
   * Options for the java project
   * These will override any inferred properties (such as the package name).
   */
  readonly javaOptions: Omit<
    GeneratedJavaTypesProjectOptions,
    CommonProjectOptions
  >;
}

/**
 * Options for generating libraries
 */
export interface GenerateLibraryProjectsOptions
  extends GenerateProjectsOptions {
  /**
   * Options for the react query hooks project
   * These will override any inferred properties (such as the package name)
   */
  readonly typescriptReactQueryHooksOptions: Omit<
    GeneratedTypescriptTypesProjectOptions,
    CommonProjectOptions
  >;
}

// No dashes or underscores since this is used in the package name in imports
const sanitiseJavaProjectName = (name: string) =>
  name.replace(/@/g, "").replace(/[\-/_]/g, "");

// kebab-case for java artifact ids
const sanitiseJavaArtifactId = (name: string) =>
  name.replace(/@/g, "").replace(/[/_]/g, "-");

// kebab-case for typescript packages
const sanitiseTypescriptPackageName = (name: string) => name.replace(/_/g, "-");

// snake_case for python modules
const sanitisePythonModuleName = (name: string) =>
  name.replace(/@/g, "").replace(/[\-/]/g, "_");

// Use dashes in project name since distributable's PKG-INFO always converts _ to -
// https://stackoverflow.com/questions/36300788/python-package-wheel-pkg-info-name
const sanitisePythonPackageName = (name: string) =>
  name.replace(/@/g, "").replace(/[_/]/g, "-");

/**
 * Returns a generated client project for the given language
 */
const generateRuntimeProject = (
  language: Language,
  options: GenerateRuntimeProjectsOptions
): Project => {
  const packageName = `${options.parentPackageName}-${language}-runtime`;
  const commonOptions = {
    outdir: path.join(options.generatedCodeDir, language),
    specPath: options.parsedSpecPath,
    parent: options.parent,
  };

  switch (language) {
    case Language.TYPESCRIPT: {
      logger.trace("Attempting to generate TYPESCRIPT runtime project.");
      return new GeneratedTypescriptRuntimeProject({
        ...commonOptions,
        name: sanitiseTypescriptPackageName(packageName),
        ...options.typescriptOptions,
        isWithinMonorepo: options.isWithinMonorepo,
      });
    }
    case Language.PYTHON: {
      logger.trace("Attempting to generate PYTHON runtime project.");
      return new GeneratedPythonRuntimeProject({
        ...commonOptions,
        name: sanitisePythonPackageName(packageName),
        moduleName: sanitisePythonModuleName(packageName),
        ...options.pythonOptions,
      });
    }
    case Language.JAVA: {
      logger.trace("Attempting to generate JAVA runtime project.");
      return new GeneratedJavaRuntimeProject({
        ...commonOptions,
        name: sanitiseJavaProjectName(packageName),
        artifactId: sanitiseJavaArtifactId(packageName),
        groupId: "com.generated.api",
        ...options.javaOptions,
      });
    }
    default:
      throw new Error(`Unknown runtime language ${language}`);
  }
};

export interface GenerateInfraProjectOptions
  extends GenerateRuntimeProjectsOptions {
  /**
   * Generated runtime projects
   */
  readonly generatedRuntimes: {
    readonly java?: GeneratedJavaRuntimeProject;
    readonly python?: GeneratedPythonRuntimeProject;
    readonly typescript?: GeneratedTypescriptRuntimeProject;
  };
}

/**
 * Returns a generated infrastructure project for the given language
 */
export const generateInfraProject = (
  language: Language,
  options: GenerateInfraProjectOptions
): Project => {
  new TextFile(
    options.parent,
    path.join(options.generatedCodeDir, "README.md"),
    {
      lines: [
        "## Generated Infrastructure",
        "",
        "This directory contains a generated type-safe CDK construct which will can the API gateway infrastructure for an API based on your model.",
      ],
      readonly: true,
    }
  );

  const infraName = `${options.parentPackageName}-${language}-infra`;
  const commonOptions = {
    outdir: path.join(options.generatedCodeDir, language),
    specPath: options.parsedSpecPath,
    parent: options.parent,
  };

  switch (language) {
    case Language.TYPESCRIPT: {
      logger.trace("Attempting to generate TYPESCRIPT infra project.");
      if (!options.generatedRuntimes.typescript) {
        throw new Error(
          "A typescript types project must be created for typescript infrastructure"
        );
      }
      return new GeneratedTypescriptCdkInfrastructureProject({
        ...commonOptions,
        name: sanitiseTypescriptPackageName(infraName),
        generatedTypescriptTypes: options.generatedRuntimes.typescript,
        ...options.typescriptOptions,
        isWithinMonorepo: options.isWithinMonorepo,
      });
    }
    case Language.PYTHON: {
      logger.trace("Attempting to generate PYTHON infra project.");
      if (!options.generatedRuntimes.python) {
        throw new Error(
          "A python types project must be created for python infrastructure"
        );
      }
      return new GeneratedPythonCdkInfrastructureProject({
        ...commonOptions,
        name: sanitisePythonPackageName(infraName),
        moduleName: sanitisePythonModuleName(infraName),
        generatedPythonTypes: options.generatedRuntimes.python,
        ...options.pythonOptions,
      });
    }
    case Language.JAVA: {
      logger.trace("Attempting to generate JAVA infra project.");
      if (!options.generatedRuntimes.java) {
        throw new Error(
          "A java types project must be created for java infrastructure"
        );
      }
      return new GeneratedJavaCdkInfrastructureProject({
        ...commonOptions,
        name: sanitiseJavaProjectName(infraName),
        artifactId: sanitiseJavaArtifactId(infraName),
        groupId: "com.generated.api",
        generatedJavaTypes: options.generatedRuntimes.java,
        ...options.javaOptions,
      });
    }
    default:
      throw new Error(`Unknown infrastructure language ${language}`);
  }
};

/**
 * Create runtime projects in the given languages
 * @param languages the languages to generate for
 * @param options options for the projects to be created
 */
export const generateRuntimeProjects = (
  languages: Language[],
  options: GenerateRuntimeProjectsOptions
): { [language: string]: Project } => {
  new TextFile(
    options.parent,
    path.join(options.generatedCodeDir, "README.md"),
    {
      lines: [
        "## Generated Runtimes",
        "",
        "This directory contains generated runtime projects based on your API model.",
        "",
        "Each runtime project includes types from your API model, as well as type-safe client and server code.",
      ],
      readonly: true,
    }
  );

  const generatedRuntimes: { [language: string]: Project } = {};
  languages.forEach((language) => {
    const project = generateRuntimeProject(language, options);
    if (project != null) {
      generatedRuntimes[language] = project;
    }
  });

  return generatedRuntimes;
};

/**
 * Returns a generated client project for the given language
 */
const generateLibraryProject = (
  library: Library,
  options: GenerateLibraryProjectsOptions
): Project => {
  const packageName = `${options.parentPackageName}-${library}`;
  const commonOptions = {
    outdir: path.join(options.generatedCodeDir, library),
    specPath: options.parsedSpecPath,
    parent: options.parent,
  };

  switch (library) {
    case Library.TYPESCRIPT_REACT_QUERY_HOOKS: {
      return new TypescriptReactQueryHooksLibrary({
        ...commonOptions,
        name: sanitiseTypescriptPackageName(packageName),
        ...options.typescriptReactQueryHooksOptions,
        isWithinMonorepo: options.isWithinMonorepo,
      });
    }
    default:
      throw new Error(`Unknown library ${library}`);
  }
};

/**
 * Create library projects
 * @param libraries the libraries to generate for
 * @param options options for the projects to be created
 */
export const generateLibraryProjects = (
  libraries: Library[],
  options: GenerateLibraryProjectsOptions
): { [library: string]: Project } => {
  if (libraries.length > 0) {
    new TextFile(
      options.parent,
      path.join(options.generatedCodeDir, "README.md"),
      {
        lines: [
          "## Generated Libraries",
          "",
          "This directory contains generated libraries based on your API model.",
        ],
        readonly: true,
      }
    );
  }

  const generatedLibraries: { [language: string]: Project } = {};
  libraries.forEach((library) => {
    const project = generateLibraryProject(library, options);
    if (project != null) {
      generatedLibraries[library] = project;
    }
  });

  return generatedLibraries;
};

export interface GenerateDocsProjectsOptions {
  /**
   * The parent project for the generated clients
   */
  readonly parent: Project;
  /**
   * The name of the api package, used to infer doc package names
   */
  readonly parentPackageName: string;
  /**
   * The directory in which to generate docs for all formats
   */
  readonly generatedDocsDir: string;
  /**
   * Path to the parsed spec file
   * We use the parsed spec such that refs are resolved to support multi-file specs
   */
  readonly parsedSpecPath: string;
}

const generateDocsProject = (
  format: DocumentationFormat,
  options: GenerateDocsProjectsOptions
): Project => {
  const commonProps = {
    name: `${options.parentPackageName}-documentation-${format.replace(
      /_/g,
      "-"
    )}`,
    parent: options.parent,
    outdir: path.join(options.generatedDocsDir, format),
    specPath: options.parsedSpecPath,
  };

  switch (format) {
    case DocumentationFormat.HTML2: {
      return new GeneratedHtml2DocumentationProject(commonProps);
    }
    case DocumentationFormat.HTML_REDOC: {
      return new GeneratedHtmlRedocDocumentationProject(commonProps);
    }
    case DocumentationFormat.MARKDOWN: {
      return new GeneratedMarkdownDocumentationProject(commonProps);
    }
    case DocumentationFormat.PLANTUML: {
      return new GeneratedPlantumlDocumentationProject(commonProps);
    }
    default:
      throw new Error(`Unknown documentation format ${format}`);
  }
};

export const generateDocsProjects = (
  formats: DocumentationFormat[],
  options: GenerateDocsProjectsOptions
): { [language: string]: Project } => {
  if (formats.length > 0) {
    new TextFile(
      options.parent,
      path.join(options.generatedDocsDir, "README.md"),
      {
        lines: [
          "## Generated Documentation",
          "",
          "This directory contains generated documentation based on your API model.",
        ],
        readonly: true,
      }
    );
  }

  const generatedClients: { [language: string]: Project } = {};
  formats.forEach((format) => {
    const project = generateDocsProject(format, options);
    if (project != null) {
      generatedClients[format] = project;
    }
  });

  return generatedClients;
};
