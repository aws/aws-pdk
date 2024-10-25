/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import {
  MonorepoTsProject,
  MonorepoJavaProject,
  MonorepoPythonProject,
  NxProject,
  NxWorkspace,
  ProjectUtils,
} from "@aws/monorepo";
import { Project, ProjectOptions, SampleFile } from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import {
  generateDocsProjects,
  generateAsyncRuntimeProjects,
  generateAsyncHandlersProjects,
  generateAsyncInfraProject,
  generateAsyncLibraryProjects,
  generateAsyncModelProject,
} from "./codegen/generate";
import { GeneratedJavaAsyncHandlersProject } from "./codegen/handlers/generated-java-async-handlers-project";
import { GeneratedPythonAsyncHandlersProject } from "./codegen/handlers/generated-python-async-handlers-project";
import { GeneratedTypescriptAsyncHandlersProject } from "./codegen/handlers/generated-typescript-async-handlers-project";
import { GeneratedJavaAsyncRuntimeProject } from "./codegen/runtime/generated-java-async-runtime-project";
import { GeneratedPythonAsyncRuntimeProject } from "./codegen/runtime/generated-python-async-runtime-project";
import { GeneratedTypescriptAsyncRuntimeProject } from "./codegen/runtime/generated-typescript-async-runtime-project";
import {
  Language,
  WebSocketDocumentationFormat,
  WebSocketLibrary,
} from "./languages";
import { ModelConfiguration } from "./type-safe-api-project";
import {
  GeneratedRuntimeCodeOptions,
  GeneratedCodeProjects,
  GeneratedInfrastructureCodeOptions,
  GeneratedHandlersCodeOptions,
  ProjectCollections,
  GeneratedWebSocketLibraryOptions,
  GeneratedWebSocketLibraryProjects,
  GeneratedWebSocketDocumentationProjects,
  GeneratedWebSocketDocumentationOptions,
  WebSocketModelProject,
} from "./types";

/**
 * Configuration for generated runtime projects
 */
export interface WebSocketRuntimeConfiguration {
  /**
   * The languages that runtime projects will be generated in. These projects can be used to provide type safety for
   * both client and server projects.
   */
  readonly languages: Language[];
  /**
   * Options for the generated runtimes. Note that only options provided for the specified languages will apply.
   */
  readonly options?: GeneratedRuntimeCodeOptions;
}

/**
 * Configuration for generated infrastructure
 */
export interface WebSocketInfrastructureConfiguration {
  /**
   * The language to generate the type-safe CDK infrastructure in
   */
  readonly language: Language;
  /**
   * Options for the infrastructure package. Note that only those provided for the specified language will apply.
   */
  readonly options?: GeneratedInfrastructureCodeOptions;
}

/**
 * Configuration for generated lambda handlers
 */
export interface WebSocketHandlersConfiguration {
  /**
   * The languages lambda handlers are written in. Specify multiple languages if you wish to implement different operations
   * as AWS Lambda functions in different languages.
   */
  readonly languages: Language[];
  /**
   * Options for the infrastructure package. Note that only those provided for the specified language will apply.
   */
  readonly options?: GeneratedHandlersCodeOptions;
}

/**
 * Configuration for generated documentation
 */
export interface WebSocketDocumentationConfiguration {
  /**
   * Formats for generated documentation
   */
  readonly formats: WebSocketDocumentationFormat[];
  /**
   * Options for the generated documentation projects. Note that only those provided for the specified formats will apply
   */
  readonly options?: GeneratedWebSocketDocumentationOptions;
}

/**
 * Configuration for generated libraries
 */
export interface WebSocketLibraryConfiguration {
  /**
   * The libraries to generate
   */
  readonly libraries: WebSocketLibrary[];
  /**
   * Options for the generated library package. Note that only options for the specified libraries will apply
   */
  readonly options?: GeneratedWebSocketLibraryOptions;
}

export interface TypeSafeWebSocketApiModelConfiguration
  extends ModelConfiguration {}

/**
 * Options for the TypeSafeWebSocketApiProject
 */
export interface TypeSafeWebSocketApiProjectOptions extends ProjectOptions {
  /**
   * Configuration for the API model
   */
  readonly model: TypeSafeWebSocketApiModelConfiguration;
  /**
   * Configuration for generated runtime projects (containing types, clients and server code)
   */
  readonly runtime?: WebSocketRuntimeConfiguration;
  /**
   * Configuration for generated infrastructure
   */
  readonly infrastructure: WebSocketInfrastructureConfiguration;
  /**
   * Configuration for lambda handlers for implementing the API
   */
  readonly handlers?: WebSocketHandlersConfiguration;
  /**
   * Configuration for generated documentation
   */
  readonly documentation?: WebSocketDocumentationConfiguration;
  /**
   * Configuration for generated libraries. These include clients for interacting with your websocket API
   */
  readonly library?: WebSocketLibraryConfiguration;
}

/**
 * Project for a Type Safe WebSocket API, defined using Smithy or OpenAPI.
 *
 * Generates a CDK construct to deploy your API, as well as client and server code to help build your API quickly.
 *
 * @experimental
 * @pjid type-safe-ws-api
 */
export class TypeSafeWebSocketApiProject extends Project {
  /**
   * Project for the api model.
   */
  public readonly model: WebSocketModelProject;
  /**
   * Generated runtime projects. When `runtime.languages` includes the corresponding language, the project can be
   * assumed to be defined.
   */
  public readonly runtime: GeneratedCodeProjects;
  /**
   * Generated infrastructure projects. Only the property corresponding to `infrastructure.language` will be defined.
   */
  public readonly infrastructure: GeneratedCodeProjects;
  /**
   * Lambda handlers projects. Only the properties corresponding to `handlers.languages` will be defined.
   */
  public readonly handlers: GeneratedCodeProjects;
  /**
   * Generated library projects. Only the properties corresponding to specified `library.libraries` will be defined.
   */
  public readonly library: GeneratedWebSocketLibraryProjects;
  /**
   * Generated documentation projects. Only the properties corresponding to specified `documentation.formats` will be defined.
   */
  public readonly documentation: GeneratedWebSocketDocumentationProjects;
  /**
   * Collections of all sub-projects managed by this project
   */
  public readonly all: ProjectCollections;

  constructor(options: TypeSafeWebSocketApiProjectOptions) {
    super(options);

    const nxWorkspace = this.getNxWorkspace(options);

    const isNxWorkspace =
      this.parent &&
      (ProjectUtils.isNamedInstanceOf(this.parent, MonorepoTsProject) ||
        ProjectUtils.isNamedInstanceOf(this.parent, MonorepoJavaProject) ||
        ProjectUtils.isNamedInstanceOf(this.parent, MonorepoPythonProject));

    const handlerLanguages = [...new Set(options.handlers?.languages ?? [])];

    // Try to infer monorepo default release branch, otherwise default to mainline unless overridden
    const defaultReleaseBranch =
      nxWorkspace?.affected.defaultBase ?? "mainline";
    const packageManager =
      this.parent && ProjectUtils.isNamedInstanceOf(this.parent, NodeProject)
        ? this.parent.package.packageManager
        : NodePackageManager.PNPM;

    // API Definition project containing the model
    const modelDir = "model";
    const parsedSpecFile = ".api.json";
    const asyncApiSpecFile = ".asyncapi.json";
    this.model = generateAsyncModelProject({
      parent: nxWorkspace ? this.parent : this,
      outdir: nxWorkspace ? path.join(options.outdir!, modelDir) : modelDir,
      name: `${options.name}-model`,
      modelLanguage: options.model.language,
      modelOptions: options.model.options,
      handlerLanguages,
      packageManager,
      defaultReleaseBranch,
      parsedSpecFile,
      asyncApiSpecFile,
    });
    const modelProject = [
      this.model.openapi,
      this.model.smithy,
      this.model.typeSpec,
    ].filter((m) => m)[0] as Project;

    // Ensure we always generate a runtime project for the infrastructure language, regardless of what was specified by
    // the user. Likewise we generate a runtime project for any handler languages specified
    const runtimeLanguages = [
      ...new Set([
        ...(options.runtime?.languages ?? []),
        options.infrastructure.language,
        ...(options.handlers?.languages ?? []),
      ]),
    ];

    // TODO: Delete when python/java support is implemented
    if (
      runtimeLanguages.includes(Language.JAVA) ||
      runtimeLanguages.includes(Language.PYTHON)
    ) {
      const errorMessages = [
        ...(runtimeLanguages.includes(Language.PYTHON)
          ? [
              "Python is not supported by Type Safe WebSocket API. Please +1 this issue if needed: https://github.com/aws/aws-pdk/issues/741",
            ]
          : []),
        ...(runtimeLanguages.includes(Language.JAVA)
          ? [
              "Java is not supported by Type Safe WebSocket API. Please +1 this issue if needed: https://github.com/aws/aws-pdk/issues/740",
            ]
          : []),
      ];
      throw new Error(errorMessages.join("\n"));
    }

    const generatedDir = "generated";
    const runtimeDir = path.join(generatedDir, "runtime");
    const runtimeDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, runtimeDir)
      : runtimeDir;

    // Path from a generated package directory (eg api/generated/runtime/typescript) to the model dir (ie api/model)
    const relativePathToModelDirFromGeneratedPackageDir = path.relative(
      path.join(this.outdir, runtimeDir, "language"),
      path.join(this.outdir, modelDir)
    );
    const parsedSpecRelativeToGeneratedPackageDir = path.join(
      relativePathToModelDirFromGeneratedPackageDir,
      this.model.parsedSpecFile
    );

    // Declare the generated runtime projects
    const generatedRuntimeProjects = generateAsyncRuntimeProjects(
      runtimeLanguages,
      {
        parent: nxWorkspace ? this.parent! : this,
        parentPackageName: this.name,
        generatedCodeDir: runtimeDirRelativeToParent,
        isWithinMonorepo: isNxWorkspace,
        // Spec path relative to each generated runtime dir
        parsedSpecPath: parsedSpecRelativeToGeneratedPackageDir,
        typescriptOptions: {
          defaultReleaseBranch,
          packageManager,
          ...options.runtime?.options?.typescript,
        },
        pythonOptions: {
          authorName: "APJ Cope",
          authorEmail: "apj-cope@amazon.com",
          version: "0.0.0",
          ...options.runtime?.options?.python,
        },
        javaOptions: {
          version: "0.0.0",
          ...options.runtime?.options?.java,
        },
      }
    );

    const documentationFormats = [
      ...new Set(options.documentation?.formats ?? []),
    ];

    const docsDir = path.join(generatedDir, "documentation");
    const docsDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, docsDir)
      : docsDir;

    // AsyncAPI specification is used for WebSocket documentation generation
    const asyncapiJsonFilePathRelativeToGeneratedPackageDir = path.join(
      relativePathToModelDirFromGeneratedPackageDir,
      this.model.asyncApiSpecFile
    );

    const generatedDocs = generateDocsProjects(documentationFormats, {
      parent: nxWorkspace ? this.parent! : this,
      parentPackageName: this.name,
      generatedDocsDir: docsDirRelativeToParent,
      // Spec path relative to each generated doc format dir
      parsedSpecPath: asyncapiJsonFilePathRelativeToGeneratedPackageDir,
      asyncDocumentationOptions: options.documentation?.options,
    });

    // Documentation projects use AsyncAPI generator which can intermittently fail
    // when executed in parallel to other AsyncAPI generator commands. We protect against this
    // by ensuring documentation projects are built sequentially.
    const docProjects = Object.values(generatedDocs);
    docProjects.forEach((docProject, i) => {
      if (docProjects[i - 1]) {
        NxProject.ensure(docProjects[i - 1]).addImplicitDependency(docProject);
      }
    });

    this.documentation = {
      html: generatedDocs[WebSocketDocumentationFormat.HTML],
      markdown: generatedDocs[WebSocketDocumentationFormat.MARKDOWN],
    };

    const librarySet = new Set(options.library?.libraries ?? []);
    // Hooks depend on client, so always add the client if we specified hooks
    if (librarySet.has(WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS)) {
      librarySet.add(WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT);
    }
    const libraries = [...librarySet];

    const libraryDir = path.join(generatedDir, "libraries");
    const libraryDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, libraryDir)
      : libraryDir;

    // Declare the generated runtime projects
    const generatedLibraryProjects = generateAsyncLibraryProjects(libraries, {
      parent: nxWorkspace ? this.parent! : this,
      parentPackageName: this.name,
      generatedCodeDir: libraryDirRelativeToParent,
      isWithinMonorepo: isNxWorkspace,
      // Spec path relative to each generated library dir
      parsedSpecPath: parsedSpecRelativeToGeneratedPackageDir,
      typescriptWebSocketClientOptions: {
        defaultReleaseBranch,
        packageManager,
        ...options.library?.options?.typescriptWebSocketClient,
      },
      typescriptWebSocketHooksOptions: {
        defaultReleaseBranch,
        clientPackageName:
          options.library?.options?.typescriptWebSocketClient?.name,
        packageManager,
        ...options.library?.options?.typescriptWebSocketHooks,
      },
    });

    // Ensure the generated runtime, libraries and docs projects have a dependency on the model project
    if (this.parent) {
      [
        ...Object.values(generatedRuntimeProjects),
        ...Object.values(generatedDocs),
        ...Object.values(generatedLibraryProjects),
      ].forEach((project) => {
        NxProject.ensure(project).addImplicitDependency(modelProject);
      });
    }

    this.runtime = {
      typescript: generatedRuntimeProjects[Language.TYPESCRIPT]
        ? (generatedRuntimeProjects[Language.TYPESCRIPT] as TypeScriptProject)
        : undefined,
      java: generatedRuntimeProjects[Language.JAVA]
        ? (generatedRuntimeProjects[Language.JAVA] as JavaProject)
        : undefined,
      python: generatedRuntimeProjects[Language.PYTHON]
        ? (generatedRuntimeProjects[Language.PYTHON] as PythonProject)
        : undefined,
    };

    this.library = {
      typescriptWebSocketClient: generatedLibraryProjects[
        WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT
      ]
        ? (generatedLibraryProjects[
            WebSocketLibrary.TYPESCRIPT_WEBSOCKET_CLIENT
          ] as TypeScriptProject)
        : undefined,
      typescriptWebSocketHooks: generatedLibraryProjects[
        WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS
      ]
        ? (generatedLibraryProjects[
            WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS
          ] as TypeScriptProject)
        : undefined,
    };

    // For the hooks library, add a dependency on the client
    if (
      this.library.typescriptWebSocketHooks &&
      this.library.typescriptWebSocketClient
    ) {
      this.library.typescriptWebSocketHooks.addDeps(
        this.library.typescriptWebSocketClient.package.packageName
      );
    }

    const handlersDir = "handlers";
    const handlersDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, handlersDir)
      : handlersDir;

    const relativePathToModelDirFromHandlersDir = path.relative(
      path.join(this.outdir, handlersDir, "language"),
      path.join(this.outdir, modelDir)
    );
    const parsedSpecRelativeToHandlersDir = path.join(
      relativePathToModelDirFromHandlersDir,
      this.model.parsedSpecFile
    );

    // Declare the generated handlers projects
    const generatedHandlersProjects = generateAsyncHandlersProjects(
      handlerLanguages,
      {
        parent: nxWorkspace ? this.parent! : this,
        parentPackageName: this.name,
        generatedCodeDir: handlersDirRelativeToParent,
        isWithinMonorepo: isNxWorkspace,
        // Spec path relative to each generated handlers package dir
        parsedSpecPath: parsedSpecRelativeToHandlersDir,
        typescriptOptions: {
          defaultReleaseBranch,
          packageManager,
          ...options.handlers?.options?.typescript,
        },
        pythonOptions: {
          authorName: "APJ Cope",
          authorEmail: "apj-cope@amazon.com",
          version: "0.0.0",
          ...options.handlers?.options?.python,
        },
        javaOptions: {
          version: "0.0.0",
          ...options.handlers?.options?.java,
        },
        generatedRuntimes: {
          typescript: this.runtime.typescript as
            | GeneratedTypescriptAsyncRuntimeProject
            | undefined,
          python: this.runtime.python as
            | GeneratedPythonAsyncRuntimeProject
            | undefined,
          java: this.runtime.java as
            | GeneratedJavaAsyncRuntimeProject
            | undefined,
        },
      }
    );

    this.handlers = {
      typescript: generatedHandlersProjects[Language.TYPESCRIPT]
        ? (generatedHandlersProjects[Language.TYPESCRIPT] as TypeScriptProject)
        : undefined,
      java: generatedHandlersProjects[Language.JAVA]
        ? (generatedHandlersProjects[Language.JAVA] as JavaProject)
        : undefined,
      python: generatedHandlersProjects[Language.PYTHON]
        ? (generatedHandlersProjects[Language.PYTHON] as PythonProject)
        : undefined,
    };

    // Ensure the handlers project depends on the appropriate runtime projects
    if (this.handlers.typescript) {
      NxProject.ensure(this.handlers.typescript).addImplicitDependency(
        this.runtime.typescript!
      );
    }
    if (this.handlers.java) {
      NxProject.ensure(this.handlers.java).addImplicitDependency(
        this.runtime.java!
      );
    }
    if (this.handlers.python) {
      NxProject.ensure(this.handlers.python).addImplicitDependency(
        this.runtime.python!
      );
    }

    const infraDir = path.join(generatedDir, "infrastructure");
    const infraDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, infraDir)
      : infraDir;

    // Infrastructure project
    const infraProject = generateAsyncInfraProject(
      options.infrastructure.language,
      {
        parent: nxWorkspace ? this.parent! : this,
        parentPackageName: this.name,
        generatedCodeDir: infraDirRelativeToParent,
        isWithinMonorepo: isNxWorkspace,
        // Spec path relative to each generated infra package dir
        parsedSpecPath: parsedSpecRelativeToGeneratedPackageDir,
        typescriptOptions: {
          defaultReleaseBranch,
          packageManager,
          ...options.infrastructure.options?.typescript,
        },
        pythonOptions: {
          authorName: "APJ Cope",
          authorEmail: "apj-cope@amazon.com",
          version: "0.0.0",
          ...options.infrastructure.options?.python,
        },
        javaOptions: {
          version: "0.0.0",
          ...options.infrastructure.options?.java,
        },
        generatedRuntimes: {
          typescript: this.runtime.typescript as
            | GeneratedTypescriptAsyncRuntimeProject
            | undefined,
          python: this.runtime.python as
            | GeneratedPythonAsyncRuntimeProject
            | undefined,
          java: this.runtime.java as
            | GeneratedJavaAsyncRuntimeProject
            | undefined,
        },
        generatedHandlers: {
          typescript: this.handlers.typescript as
            | GeneratedTypescriptAsyncHandlersProject
            | undefined,
          python: this.handlers.python as
            | GeneratedPythonAsyncHandlersProject
            | undefined,
          java: this.handlers.java as
            | GeneratedJavaAsyncHandlersProject
            | undefined,
        },
      }
    );

    const infraProjects: {
      -readonly [K in keyof GeneratedCodeProjects]: GeneratedCodeProjects[K];
    } = {};

    // Add implicit dependencies and assign the appropriate infrastructure project member
    switch (options.infrastructure.language) {
      case Language.JAVA:
        NxProject.ensure(infraProject).addImplicitDependency(
          this.runtime.java!
        );
        infraProjects.java = infraProject as JavaProject;
        break;
      case Language.PYTHON:
        NxProject.ensure(infraProject).addImplicitDependency(
          this.runtime.python!
        );
        infraProjects.python = infraProject as PythonProject;
        break;
      case Language.TYPESCRIPT:
        NxProject.ensure(infraProject).addImplicitDependency(
          this.runtime.typescript!
        );
        infraProjects.typescript = infraProject as TypeScriptProject;
        break;
      default:
        throw new Error(
          `Unknown infrastructure language ${options.infrastructure.language}`
        );
    }
    this.infrastructure = infraProjects;

    NxProject.ensure(infraProject).addImplicitDependency(modelProject);

    // Expose collections of projects
    const allRuntimes = Object.values(generatedRuntimeProjects);
    const allInfrastructure = [infraProject];
    const allLibraries = Object.values(generatedLibraryProjects);
    const allDocumentation = Object.values(generatedDocs);
    const allHandlers = Object.values(generatedHandlersProjects);

    this.all = {
      model: [modelProject],
      runtimes: allRuntimes,
      infrastructure: allInfrastructure,
      libraries: allLibraries,
      documentation: allDocumentation,
      handlers: allHandlers,
      projects: [
        modelProject,
        ...allRuntimes,
        ...allInfrastructure,
        ...allLibraries,
        ...allDocumentation,
        ...allHandlers,
      ],
    };

    if (!nxWorkspace) {
      // Add a task for the non-monorepo case to build the projects in the right order
      [
        modelProject,
        ...Object.values(generatedRuntimeProjects),
        infraProject,
        ...Object.values(generatedLibraryProjects),
        ...Object.values(generatedDocs),
      ].forEach((project) => {
        this.compileTask.exec("npx projen build", {
          cwd: path.relative(this.outdir, project.outdir),
        });
      });
    }

    // Add the README as a sample file which the user may edit
    new SampleFile(this, "README.md", {
      sourcePath: path.resolve(
        __dirname,
        "..",
        "..",
        "samples",
        "type-safe-api",
        "readme",
        "TYPE_SAFE_API.md"
      ),
    });
  }

  private getNxWorkspace = (
    options: TypeSafeWebSocketApiProjectOptions
  ): NxWorkspace | undefined => {
    return options.parent ? NxWorkspace.of(options.parent) : undefined;
  };
}
