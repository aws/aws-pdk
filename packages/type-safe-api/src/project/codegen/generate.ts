/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { getLogger } from "log4js";
import { Project, TextFile } from "projen";
import { NodePackageManager } from "projen/lib/javascript";
import {
  DocumentationFormat,
  Language,
  Library,
  WebSocketDocumentationFormat,
  WebSocketLibrary,
} from "../languages";
import { GeneratedAsyncApiHtmlDocumentationProject } from "./documentation/generated-asyncapi-html-documentation-project";
import { GeneratedAsyncApiMarkdownDocumentationProject } from "./documentation/generated-asyncapi-markdown-documentation-project";
import { GeneratedHtmlRedocDocumentationProject } from "./documentation/generated-html-redoc-documentation-project";
import { GeneratedMarkdownDocumentationProject } from "./documentation/generated-markdown-documentation-project";
import { GeneratedPlantumlDocumentationProject } from "./documentation/generated-plantuml-documentation-project";
import { GeneratedJavaAsyncHandlersProject } from "./handlers/generated-java-async-handlers-project";
import { GeneratedJavaHandlersBaseProject } from "./handlers/generated-java-handlers-base-project";
import { GeneratedJavaHandlersProject } from "./handlers/generated-java-handlers-project";
import { GeneratedPythonAsyncHandlersProject } from "./handlers/generated-python-async-handlers-project";
import { GeneratedPythonHandlersBaseProject } from "./handlers/generated-python-handlers-base-project";
import { GeneratedPythonHandlersProject } from "./handlers/generated-python-handlers-project";
import { GeneratedTypescriptAsyncHandlersProject } from "./handlers/generated-typescript-async-handlers-project";
import { GeneratedTypescriptHandlersBaseProject } from "./handlers/generated-typescript-handlers-base-project";
import { GeneratedTypescriptHandlersProject } from "./handlers/generated-typescript-handlers-project";
import { GeneratedJavaAsyncCdkInfrastructureProject } from "./infrastructure/cdk/generated-java-async-cdk-infrastructure-project";
import { GeneratedJavaCdkInfrastructureProject } from "./infrastructure/cdk/generated-java-cdk-infrastructure-project";
import { GeneratedPythonAsyncCdkInfrastructureProject } from "./infrastructure/cdk/generated-python-async-cdk-infrastructure-project";
import { GeneratedPythonCdkInfrastructureProject } from "./infrastructure/cdk/generated-python-cdk-infrastructure-project";
import { GeneratedTypescriptAsyncCdkInfrastructureProject } from "./infrastructure/cdk/generated-typescript-async-cdk-infrastructure-project";
import { GeneratedTypescriptCdkInfrastructureProject } from "./infrastructure/cdk/generated-typescript-cdk-infrastructure-project";
import {
  GeneratedTypescriptReactQueryHooksProjectOptions,
  TypescriptReactQueryHooksLibrary,
} from "./library/typescript-react-query-hooks-library";
import {
  TypescriptWebsocketClientLibrary,
  TypescriptWebsocketClientLibraryOptions,
} from "./library/typescript-websocket-client-library";
import {
  TypescriptWebsocketHooksLibrary,
  TypescriptWebsocketHooksLibraryOptions,
} from "./library/typescript-websocket-hooks-library";
import { GeneratedJavaAsyncRuntimeProject } from "./runtime/generated-java-async-runtime-project";
import { GeneratedJavaRuntimeBaseProject } from "./runtime/generated-java-runtime-base-project";
import {
  GeneratedJavaRuntimeProject,
  GeneratedJavaTypesProjectOptions,
} from "./runtime/generated-java-runtime-project";
import { GeneratedPythonAsyncRuntimeProject } from "./runtime/generated-python-async-runtime-project";
import { GeneratedPythonRuntimeBaseProject } from "./runtime/generated-python-runtime-base-project";
import {
  GeneratedPythonRuntimeProject,
  GeneratedPythonTypesProjectOptions,
} from "./runtime/generated-python-runtime-project";
import { GeneratedTypescriptAsyncRuntimeProject } from "./runtime/generated-typescript-async-runtime-project";
import { GeneratedTypescriptRuntimeBaseProject } from "./runtime/generated-typescript-runtime-base-project";
import {
  GeneratedTypescriptRuntimeProject,
  GeneratedTypescriptTypesProjectOptions,
} from "./runtime/generated-typescript-runtime-project";
import { OpenApiAsyncModelProject } from "../model/openapi/open-api-async-model-project";
import { OpenApiModelProject } from "../model/openapi/open-api-model-project";
import { SmithyAsyncModelProject } from "../model/smithy/smithy-async-model-project";
import { SmithyModelProject } from "../model/smithy/smithy-model-project";
import { TypeSafeApiAsyncModelBuildOutputOptions } from "../model/type-safe-api-async-model-build";
import { TypeSafeApiModelBuildOutputOptions } from "../model/type-safe-api-model-build";
import { TypeSafeApiModelProjectOptions } from "../model/type-safe-api-model-project";
import { TypeSafeWebSocketApiModelProjectOptions } from "../model/type-safe-websocket-api-model-project";
import { TypeSpecAsyncModelProject } from "../model/type-spec/type-spec-async-model-project";
import { TypeSpecModelProject } from "../model/type-spec/type-spec-model-project";
import {
  GeneratedDocumentationOptions,
  GeneratedWebSocketDocumentationOptions,
  ModelLanguage,
  ModelProject,
  WebSocketModelProject,
} from "../types";

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
   * Whether the infrastructure and types projects are parented by an monorepo or not
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

export interface GenerateLanguageProjectOptions
  extends GenerateProjectsOptions {
  /**
   * Options for the typescript project.
   * These will override any inferred properties (such as the package name).
   */
  readonly typescriptOptions: Omit<
    GeneratedTypescriptTypesProjectOptions,
    CommonProjectOptions
  > &
    Record<string, any>;
  /**
   * Options for the python project
   * These will override any inferred properties (such as the package name).
   */
  readonly pythonOptions: Omit<
    GeneratedPythonTypesProjectOptions,
    CommonProjectOptions
  > &
    Record<string, any>;
  /**
   * Options for the java project
   * These will override any inferred properties (such as the package name).
   */
  readonly javaOptions: Omit<
    GeneratedJavaTypesProjectOptions,
    CommonProjectOptions
  > &
    Record<string, any>;
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
    GeneratedTypescriptReactQueryHooksProjectOptions,
    CommonProjectOptions
  >;
}

/**
 * Options for generating websocket libraries
 */
export interface GenerateAsyncLibraryProjectsOptions
  extends GenerateProjectsOptions {
  /**
   * Options for the typescript websocket client project
   * These will override any inferred properties (such as the package name)
   */
  readonly typescriptWebSocketClientOptions: Omit<
    TypescriptWebsocketClientLibraryOptions,
    CommonProjectOptions
  >;

  /**
   * Options for the typescript websocket hooks project
   * These will override any inferred properties (such as the package name)
   */
  readonly typescriptWebSocketHooksOptions: Omit<
    TypescriptWebsocketHooksLibraryOptions,
    CommonProjectOptions | "clientPackageName"
  > &
    Partial<Pick<TypescriptWebsocketHooksLibraryOptions, "clientPackageName">>;
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

type LanguageProjectConstructors = Record<
  Language,
  new (...args: any[]) => Project
>;

const generateLanguageProject = (
  suffix: string,
  language: Language,
  projectConstructors: LanguageProjectConstructors,
  options: GenerateLanguageProjectOptions
): Project => {
  const packageName = `${options.parentPackageName}-${language}-${suffix}`;
  const commonOptions = {
    outdir: path.join(options.generatedCodeDir, language),
    specPath: options.parsedSpecPath,
    parent: options.parent,
  };

  switch (language) {
    case Language.TYPESCRIPT: {
      logger.trace(`Attempting to generate TYPESCRIPT ${suffix} project.`);
      return new projectConstructors[language]({
        ...options,
        ...commonOptions,
        name: sanitiseTypescriptPackageName(packageName),
        ...options.typescriptOptions,
        isWithinMonorepo: options.isWithinMonorepo,
      });
    }
    case Language.PYTHON: {
      logger.trace(`Attempting to generate PYTHON ${suffix} project.`);
      return new projectConstructors[language]({
        ...options,
        ...commonOptions,
        name: sanitisePythonPackageName(packageName),
        moduleName: sanitisePythonModuleName(packageName),
        ...options.pythonOptions,
      });
    }
    case Language.JAVA: {
      logger.trace(`Attempting to generate JAVA ${suffix} project.`);
      return new projectConstructors[language]({
        ...options,
        ...commonOptions,
        name: sanitiseJavaProjectName(packageName),
        artifactId: sanitiseJavaArtifactId(packageName),
        groupId: "com.generated.api",
        ...options.javaOptions,
      });
    }
    default:
      throw new Error(`Unknown ${suffix} language ${language}`);
  }
};

const generateLanguageProjects = (
  suffix: string,
  languages: Language[],
  projectConstructors: Record<Language, new (...args: any[]) => Project>,
  options: GenerateLanguageProjectOptions
) => {
  const projects: { [language: string]: Project } = {};
  languages.forEach((language) => {
    const project = generateLanguageProject(
      suffix,
      language,
      projectConstructors,
      options
    );
    if (project != null) {
      projects[language] = project;
    }
  });

  return projects;
};

/**
 * Generated handlers projects
 */
export interface GeneratedHandlersProjects {
  /**
   * Java handlers project
   */
  readonly java?: GeneratedJavaHandlersBaseProject;
  /**
   * Python handlers project
   */
  readonly python?: GeneratedPythonHandlersBaseProject;
  /**
   * TypeScript handlers project
   */
  readonly typescript?: GeneratedTypescriptHandlersBaseProject;
}

export interface GenerateInfraProjectOptions
  extends GenerateRuntimeProjectsOptions {
  /**
   * Generated runtime projects
   */
  readonly generatedRuntimes: {
    readonly java?: GeneratedJavaRuntimeBaseProject;
    readonly python?: GeneratedPythonRuntimeBaseProject;
    readonly typescript?: GeneratedTypescriptRuntimeBaseProject;
  };
  readonly generatedHandlers: GeneratedHandlersProjects;
}

/**
 * Returns a generated infrastructure project for the given language
 */
export const generateInfraProject = (
  language: Language,
  options: GenerateInfraProjectOptions
): Project => {
  return _generateInfraProject(
    language,
    {
      [Language.JAVA]: GeneratedJavaCdkInfrastructureProject,
      [Language.PYTHON]: GeneratedPythonCdkInfrastructureProject,
      [Language.TYPESCRIPT]: GeneratedTypescriptCdkInfrastructureProject,
    },
    options
  );
};

/**
 * Returns a generated async infrastructure project for the given language
 */
export const generateAsyncInfraProject = (
  language: Language,
  options: GenerateInfraProjectOptions
): Project => {
  return _generateInfraProject(
    language,
    {
      [Language.JAVA]: GeneratedJavaAsyncCdkInfrastructureProject,
      [Language.PYTHON]: GeneratedPythonAsyncCdkInfrastructureProject,
      [Language.TYPESCRIPT]: GeneratedTypescriptAsyncCdkInfrastructureProject,
    },
    options
  );
};

export const _generateInfraProject = (
  language: Language,
  projectConstructors: LanguageProjectConstructors,
  options: GenerateInfraProjectOptions
): Project => {
  new TextFile(
    options.parent,
    path.join(options.generatedCodeDir, "README.md"),
    {
      lines: [
        "## Generated Infrastructure",
        "",
        "This directory contains a generated type-safe CDK construct which can provision the API gateway infrastructure for an API based on your model.",
      ],
      readonly: true,
    }
  );

  return generateLanguageProject("infra", language, projectConstructors, {
    ...options,
    typescriptOptions: {
      ...options.typescriptOptions,
      generatedTypescriptTypes: options.generatedRuntimes.typescript,
    },
    pythonOptions: {
      ...options.pythonOptions,
      generatedPythonTypes: options.generatedRuntimes.python,
    },
    javaOptions: {
      ...options.javaOptions,
      generatedJavaTypes: options.generatedRuntimes.java,
    },
  });
};

export interface GenerateHandlersBaseProjectOptions
  extends GenerateRuntimeProjectsOptions {
  /**
   * Generated runtime projects
   */
  readonly generatedRuntimes: {
    readonly java?: GeneratedJavaRuntimeBaseProject;
    readonly python?: GeneratedPythonRuntimeBaseProject;
    readonly typescript?: GeneratedTypescriptRuntimeBaseProject;
  };
}

export interface GenerateHandlersProjectOptions
  extends GenerateHandlersBaseProjectOptions {
  /**
   * Generated runtime projects
   */
  readonly generatedRuntimes: {
    readonly java?: GeneratedJavaRuntimeProject;
    readonly python?: GeneratedPythonRuntimeProject;
    readonly typescript?: GeneratedTypescriptRuntimeProject;
  };
}

export interface GenerateAsyncHandlersProjectOptions
  extends GenerateHandlersBaseProjectOptions {
  /**
   * Generated runtime projects
   */
  readonly generatedRuntimes: {
    readonly java?: GeneratedJavaAsyncRuntimeProject;
    readonly python?: GeneratedPythonAsyncRuntimeProject;
    readonly typescript?: GeneratedTypescriptAsyncRuntimeProject;
  };
}

/**
 * Create handlers projects in the given languages
 * @param languages the languages to generate for
 * @param options options for the projects to be created
 */
export const generateHandlersProjects = (
  languages: Language[],
  options: GenerateHandlersProjectOptions
): { [language: string]: Project } => {
  return _generateHandlersProjects(
    languages,
    {
      [Language.JAVA]: GeneratedJavaHandlersProject,
      [Language.PYTHON]: GeneratedPythonHandlersProject,
      [Language.TYPESCRIPT]: GeneratedTypescriptHandlersProject,
    },
    options
  );
};

/**
 * Create async handlers projects in the given languages
 * @param languages the languages to generate for
 * @param options options for the projects to be created
 */
export const generateAsyncHandlersProjects = (
  languages: Language[],
  options: GenerateAsyncHandlersProjectOptions
): { [language: string]: Project } => {
  return _generateHandlersProjects(
    languages,
    {
      [Language.JAVA]: GeneratedJavaAsyncHandlersProject,
      [Language.PYTHON]: GeneratedPythonAsyncHandlersProject,
      [Language.TYPESCRIPT]: GeneratedTypescriptAsyncHandlersProject,
    },
    options
  );
};

const _generateHandlersProjects = (
  languages: Language[],
  projectConstructors: LanguageProjectConstructors,
  options: GenerateHandlersBaseProjectOptions
): { [language: string]: Project } => {
  if (languages.length > 0) {
    new TextFile(
      options.parent,
      path.join(options.generatedCodeDir, "README.md"),
      {
        lines: [
          "## Handlers",
          "",
          "This directory contains lambda handlers for implementing your API.",
          "",
          "Whenever an operation is annotated with the `@handler` trait in Smithy (or the `x-handler` vendor extension in OpenAPI), a stub handler implementation will be generated for you, which you are free to modify.",
        ],
        readonly: true,
      }
    );
  }

  return generateLanguageProjects("handlers", languages, projectConstructors, {
    ...options,
    typescriptOptions: {
      ...options.typescriptOptions,
      generatedTypescriptTypes: options.generatedRuntimes.typescript,
    },
    pythonOptions: {
      ...options.pythonOptions,
      generatedPythonTypes: options.generatedRuntimes.python,
    },
    javaOptions: {
      ...options.javaOptions,
      generatedJavaTypes: options.generatedRuntimes.java,
    },
  });
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
  return _generateRuntimeProjects(
    languages,
    {
      [Language.JAVA]: GeneratedJavaRuntimeProject,
      [Language.PYTHON]: GeneratedPythonRuntimeProject,
      [Language.TYPESCRIPT]: GeneratedTypescriptRuntimeProject,
    },
    options
  );
};

/**
 * Create async runtime projects in the given languages
 * @param languages the languages to generate for
 * @param options options for the projects to be created
 */
export const generateAsyncRuntimeProjects = (
  languages: Language[],
  options: GenerateRuntimeProjectsOptions
): { [language: string]: Project } => {
  return _generateRuntimeProjects(
    languages,
    {
      [Language.JAVA]: GeneratedJavaAsyncRuntimeProject,
      [Language.PYTHON]: GeneratedPythonAsyncRuntimeProject,
      [Language.TYPESCRIPT]: GeneratedTypescriptAsyncRuntimeProject,
    },
    options
  );
};

const _generateRuntimeProjects = (
  languages: Language[],
  projectConstructors: LanguageProjectConstructors,
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

  return generateLanguageProjects(
    "runtime",
    languages,
    projectConstructors,
    options
  );
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

export interface CommonModelProjectOptions {
  readonly name: string;
  readonly parent?: Project;
  readonly outdir: string;
  readonly defaultReleaseBranch: string;
  readonly packageManager: NodePackageManager;
}

export interface GenerateModelProjectOptions
  extends CommonModelProjectOptions,
    TypeSafeApiModelProjectOptions,
    TypeSafeApiModelBuildOutputOptions {}

export const generateModelProject = ({
  modelLanguage,
  modelOptions,
  ...options
}: GenerateModelProjectOptions): ModelProject => {
  if (modelLanguage === ModelLanguage.SMITHY) {
    if (!modelOptions.smithy) {
      throw new Error(
        `modelOptions.smithy is required when selected model language is ${ModelLanguage.SMITHY}`
      );
    }

    const smithy = new SmithyModelProject({
      ...options,
      smithyOptions: modelOptions.smithy,
    });
    return {
      smithy,
      parsedSpecFile: options.parsedSpecFile,
      apiName: smithy.apiName,
      outdir: smithy.outdir,
    };
  } else if (modelLanguage === ModelLanguage.OPENAPI) {
    if (!modelOptions.openapi) {
      throw new Error(
        `modelOptions.openapi is required when selected model language is ${ModelLanguage.OPENAPI}`
      );
    }

    const openapi = new OpenApiModelProject({
      ...options,
      openApiOptions: modelOptions.openapi,
    });
    return {
      openapi,
      parsedSpecFile: options.parsedSpecFile,
      apiName: openapi.apiName,
      outdir: openapi.outdir,
    };
  } else if (modelLanguage === ModelLanguage.TYPESPEC) {
    if (!modelOptions.typeSpec) {
      throw new Error(
        `modelOptions.typeSpec is required when selected model language is ${ModelLanguage.TYPESPEC}`
      );
    }

    const typeSpec = new TypeSpecModelProject({
      ...options,
      name: sanitiseTypescriptPackageName(options.name),
      typeSpecOptions: modelOptions.typeSpec,
    });
    return {
      typeSpec,
      parsedSpecFile: options.parsedSpecFile,
      apiName: typeSpec.apiName,
      outdir: typeSpec.outdir,
    };
  } else {
    throw new Error(`Unknown model language ${modelLanguage}`);
  }
};

export interface GenerateAsyncModelProjectOptions
  extends CommonModelProjectOptions,
    TypeSafeWebSocketApiModelProjectOptions,
    TypeSafeApiAsyncModelBuildOutputOptions,
    TypeSafeApiModelBuildOutputOptions {}

export const generateAsyncModelProject = ({
  modelLanguage,
  modelOptions,
  ...options
}: GenerateAsyncModelProjectOptions): WebSocketModelProject => {
  if (modelLanguage === ModelLanguage.SMITHY) {
    if (!modelOptions.smithy) {
      throw new Error(
        `modelOptions.smithy is required when selected model language is ${ModelLanguage.SMITHY}`
      );
    }

    const smithy = new SmithyAsyncModelProject({
      ...options,
      smithyOptions: modelOptions.smithy,
    });
    return {
      smithy,
      parsedSpecFile: options.parsedSpecFile,
      asyncApiSpecFile: options.asyncApiSpecFile,
      apiName: smithy.apiName,
      outdir: smithy.outdir,
    };
  } else if (modelLanguage === ModelLanguage.OPENAPI) {
    if (!modelOptions.openapi) {
      throw new Error(
        `modelOptions.openapi is required when selected model language is ${ModelLanguage.OPENAPI}`
      );
    }

    const openapi = new OpenApiAsyncModelProject({
      ...options,
      openApiOptions: modelOptions.openapi,
    });
    return {
      openapi,
      parsedSpecFile: options.parsedSpecFile,
      asyncApiSpecFile: options.asyncApiSpecFile,
      apiName: openapi.apiName,
      outdir: openapi.outdir,
    };
  } else if (modelLanguage === ModelLanguage.TYPESPEC) {
    if (!modelOptions.typeSpec) {
      throw new Error(
        `modelOptions.typeSpec is required when selected model language is ${ModelLanguage.TYPESPEC}`
      );
    }

    const typeSpec = new TypeSpecAsyncModelProject({
      ...options,
      name: sanitiseTypescriptPackageName(options.name),
      typeSpecOptions: modelOptions.typeSpec,
    });
    return {
      typeSpec,
      parsedSpecFile: options.parsedSpecFile,
      asyncApiSpecFile: options.asyncApiSpecFile,
      apiName: typeSpec.apiName,
      outdir: typeSpec.outdir,
    };
  } else {
    throw new Error(`Unknown model language ${modelLanguage}`);
  }
};

/**
 * Returns a generated client project for the given language
 */
const generateAsyncLibraryProject = (
  library: WebSocketLibrary,
  options: GenerateAsyncLibraryProjectsOptions
): Project => {
  const packageName = `${options.parentPackageName}-${library}`;
  const commonOptions = {
    outdir: path.join(options.generatedCodeDir, library),
    specPath: options.parsedSpecPath,
    parent: options.parent,
  };

  switch (library) {
    case WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT: {
      return new TypescriptWebsocketClientLibrary({
        ...commonOptions,
        name: sanitiseTypescriptPackageName(packageName),
        ...options.typescriptWebSocketClientOptions,
        isWithinMonorepo: options.isWithinMonorepo,
      });
    }
    case WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS: {
      return new TypescriptWebsocketHooksLibrary({
        ...commonOptions,
        clientPackageName:
          options.typescriptWebSocketHooksOptions.clientPackageName ??
          sanitiseTypescriptPackageName(
            `${options.parentPackageName}-${WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT}`
          ),
        name: sanitiseTypescriptPackageName(packageName),
        ...options.typescriptWebSocketClientOptions,
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
export const generateAsyncLibraryProjects = (
  libraries: WebSocketLibrary[],
  options: GenerateAsyncLibraryProjectsOptions
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
    const project = generateAsyncLibraryProject(library, options);
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
  /**
   * User-specified options for generated documentation
   */
  readonly documentationOptions?: GeneratedDocumentationOptions;
  /**
   * User-specified options for generated websocket documentation
   */
  readonly asyncDocumentationOptions?: GeneratedWebSocketDocumentationOptions;
}

const generateDocsProject = (
  format: DocumentationFormat | WebSocketDocumentationFormat,
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
    case DocumentationFormat.HTML_REDOC: {
      return new GeneratedHtmlRedocDocumentationProject({
        ...commonProps,
        ...options.documentationOptions?.htmlRedoc,
      });
    }
    case DocumentationFormat.MARKDOWN: {
      return new GeneratedMarkdownDocumentationProject({
        ...commonProps,
        ...options.documentationOptions?.markdown,
      });
    }
    case DocumentationFormat.PLANTUML: {
      return new GeneratedPlantumlDocumentationProject({
        ...commonProps,
        ...options.documentationOptions?.plantuml,
      });
    }
    case WebSocketDocumentationFormat.HTML: {
      return new GeneratedAsyncApiHtmlDocumentationProject({
        ...commonProps,
        ...options.asyncDocumentationOptions?.html,
      });
    }
    case WebSocketDocumentationFormat.MARKDOWN: {
      return new GeneratedAsyncApiMarkdownDocumentationProject({
        ...commonProps,
        ...options.asyncDocumentationOptions?.markdown,
      });
    }
    default:
      throw new Error(`Unknown documentation format ${format}`);
  }
};

export const generateDocsProjects = (
  formats: (DocumentationFormat | WebSocketDocumentationFormat)[],
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
