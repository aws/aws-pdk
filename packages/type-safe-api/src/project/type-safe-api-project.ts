/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { NxProject, NxWorkspace } from "@aws-prototyping-sdk/nx-monorepo";
import { Project, ProjectOptions, SampleFile } from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import {
  generateRuntimeProjects,
  generateDocsProjects,
  generateInfraProject,
  generateLibraryProjects,
} from "./codegen/generate";
import { GeneratedJavaRuntimeProject } from "./codegen/runtime/generated-java-runtime-project";
import { GeneratedPythonRuntimeProject } from "./codegen/runtime/generated-python-runtime-project";
import { GeneratedTypescriptRuntimeProject } from "./codegen/runtime/generated-typescript-runtime-project";
import { DocumentationFormat, Language, Library } from "./languages";
import { TypeSafeApiModelProject } from "./model/type-safe-api-model-project";
import {
  GeneratedRuntimeCodeOptions,
  GeneratedCodeProjects,
  GeneratedDocumentationOptions,
  GeneratedDocumentationProjects,
  GeneratedLibraryOptions,
  GeneratedLibraryProjects,
  ModelLanguage,
  ModelOptions,
  GeneratedInfrastructureCodeOptions,
} from "./types";

/**
 * Configuration for modelling the API
 */
export interface ModelConfiguration {
  /**
   * The language the API model is defined in.
   */
  readonly language: ModelLanguage;
  /**
   * Options for the API model.
   */
  readonly options: ModelOptions;
}

/**
 * Configuration for generated runtime projects
 */
export interface RuntimeConfiguration {
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
export interface InfrastructureConfiguration {
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
 * Configuration for generated documentation
 */
export interface DocumentationConfiguration {
  /**
   * Formats for generated documentation
   */
  readonly formats: DocumentationFormat[];
  /**
   * Options for the generated documentation projects. Note that only those provided for the specified formats will apply
   */
  readonly options?: GeneratedDocumentationOptions;
}

/**
 * Configuration for generated libraries
 */
export interface LibraryConfiguration {
  /**
   * The library to generate
   */
  readonly libraries: Library[];
  /**
   * Options for the generated library package. Note that only options for the specified libraries will apply
   */
  readonly options?: GeneratedLibraryOptions;
}

/**
 * Options for the TypeSafeApiProject
 */
export interface TypeSafeApiProjectOptions extends ProjectOptions {
  /**
   * Configuration for the API model
   */
  readonly model: ModelConfiguration;
  /**
   * Configuration for generated runtime projects (containing types, clients and server code)
   */
  readonly runtime: RuntimeConfiguration;
  /**
   * Configuration for generated infrastructure
   */
  readonly infrastructure: InfrastructureConfiguration;
  /**
   * Configuration for generated documentation
   */
  readonly documentation?: DocumentationConfiguration;
  /**
   * Configuration for generated libraries. Libraries are projects which are generated from your model, but are not
   * fully-fledged runtimes, for example react hooks or clients in languages that aren't supported as runtimes.
   */
  readonly library?: LibraryConfiguration;
}

/**
 * Project for a type-safe API, defined using Smithy or OpenAPI.
 *
 * Generates a CDK construct to deploy your API, as well as client and server code to help build your API quickly.
 *
 * @pjid type-safe-api
 */
export class TypeSafeApiProject extends Project {
  /**
   * Project for the api model
   */
  public readonly model: TypeSafeApiModelProject;
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
   * Generated library projects. Only the properties corresponding to specified `library.libraries` will be defined.
   */
  public readonly library: GeneratedLibraryProjects;
  /**
   * Generated documentation projects. Only the properties corresponding to specified `documentation.formats` will be defined.
   */
  public readonly documentation: GeneratedDocumentationProjects;

  constructor(options: TypeSafeApiProjectOptions) {
    super(options);

    const nxWorkspace = this.getNxWorkspace(options);

    // API Definition project containing the model
    const modelDir = "model";
    this.model = new TypeSafeApiModelProject({
      parent: nxWorkspace ? this.parent : this,
      outdir: nxWorkspace ? path.join(options.outdir!, modelDir) : modelDir,
      name: `${options.name}-model`,
      modelLanguage: options.model.language,
      modelOptions: options.model.options,
    });
    const parsedSpecPathRelativeToProjectRoot = path.join(
      modelDir,
      this.model.parsedSpecFile
    );

    // Ensure we always generate a runtime project for the infrastructure language, regardless of what was specified by
    // the user
    const runtimeLanguages = [
      ...new Set([
        ...options.runtime.languages,
        options.infrastructure.language,
      ]),
    ];

    const runtimeDir = "runtime";
    const runtimeDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, runtimeDir)
      : runtimeDir;

    // Declare the generated runtime projects
    const generatedRuntimeProjects = generateRuntimeProjects(runtimeLanguages, {
      parent: nxWorkspace ? this.parent! : this,
      parentPackageName: this.name,
      generatedCodeDir: runtimeDirRelativeToParent,
      isWithinMonorepo: !!nxWorkspace,
      // Spec path relative to each generated client dir
      parsedSpecPath: path.join(
        "..",
        "..",
        parsedSpecPathRelativeToProjectRoot
      ),
      typescriptOptions: {
        // Try to infer monorepo default release branch, otherwise default to mainline unless overridden
        defaultReleaseBranch: nxWorkspace?.affected?.defaultBase ?? "mainline",
        packageManager:
          this.parent && this.parent instanceof NodeProject
            ? this.parent.package.packageManager
            : NodePackageManager.YARN,
        ...options.runtime.options?.typescript,
      },
      pythonOptions: {
        authorName: "APJ Cope",
        authorEmail: "apj-cope@amazon.com",
        version: "0.0.0",
        ...options.runtime.options?.python,
      },
      javaOptions: {
        version: "0.0.0",
        ...options.runtime.options?.java,
      },
    });

    const documentationFormats = [
      ...new Set(options.documentation?.formats ?? []),
    ];

    const docsDir = "documentation";
    const docsDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, docsDir)
      : docsDir;

    const generatedDocs = generateDocsProjects(documentationFormats, {
      parent: nxWorkspace ? this.parent! : this,
      parentPackageName: this.name,
      generatedDocsDir: docsDirRelativeToParent,
      // Spec path relative to each generated doc format dir
      parsedSpecPath: path.join(
        "..",
        "..",
        parsedSpecPathRelativeToProjectRoot
      ),
      documentationOptions: options.documentation?.options,
    });

    this.documentation = {
      htmlRedoc: generatedDocs[DocumentationFormat.HTML_REDOC],
      html2: generatedDocs[DocumentationFormat.HTML2],
      markdown: generatedDocs[DocumentationFormat.MARKDOWN],
      plantuml: generatedDocs[DocumentationFormat.PLANTUML],
    };

    const libraries = [...new Set(options.library?.libraries ?? [])];

    const libraryDir = "libraries";
    const libraryDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, libraryDir)
      : libraryDir;

    // Declare the generated runtime projects
    const generatedLibraryProjects = generateLibraryProjects(libraries, {
      parent: nxWorkspace ? this.parent! : this,
      parentPackageName: this.name,
      generatedCodeDir: libraryDirRelativeToParent,
      isWithinMonorepo: !!this.parent,
      // Spec path relative to each generated client dir
      parsedSpecPath: path.join(
        "..",
        "..",
        parsedSpecPathRelativeToProjectRoot
      ),
      typescriptReactQueryHooksOptions: {
        // Try to infer monorepo default release branch, otherwise default to mainline unless overridden
        defaultReleaseBranch: nxWorkspace?.affected.defaultBase ?? "mainline",
        packageManager:
          this.parent && this.parent instanceof NodeProject
            ? this.parent.package.packageManager
            : NodePackageManager.YARN,
        ...options.runtime.options?.typescript,
      },
    });

    // Ensure the generated runtime, libraries and docs projects have a dependency on the model project
    if (this.parent) {
      [
        ...Object.values(generatedRuntimeProjects),
        ...Object.values(generatedDocs),
        ...Object.values(generatedLibraryProjects),
      ].forEach((project) => {
        NxProject.ensure(project).addImplicitDependency(this.model);
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
      typescriptReactQueryHooks: generatedLibraryProjects[
        Library.TYPESCRIPT_REACT_QUERY_HOOKS
      ]
        ? (generatedLibraryProjects[
            Library.TYPESCRIPT_REACT_QUERY_HOOKS
          ] as TypeScriptProject)
        : undefined,
    };

    const infraDir = "infrastructure";
    const infraDirRelativeToParent = nxWorkspace
      ? path.join(options.outdir!, infraDir)
      : infraDir;

    // Infrastructure project
    const infraProject = generateInfraProject(options.infrastructure.language, {
      parent: nxWorkspace ? this.parent! : this,
      parentPackageName: this.name,
      generatedCodeDir: infraDirRelativeToParent,
      isWithinMonorepo: !!this.parent,
      // Spec path relative to each generated infra package dir
      parsedSpecPath: path.join(
        "..",
        "..",
        parsedSpecPathRelativeToProjectRoot
      ),
      typescriptOptions: {
        // Try to infer monorepo default release branch, otherwise default to mainline unless overridden
        defaultReleaseBranch: nxWorkspace?.affected.defaultBase ?? "mainline",
        packageManager:
          this.parent && this.parent instanceof NodeProject
            ? this.parent.package.packageManager
            : NodePackageManager.YARN,
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
          | GeneratedTypescriptRuntimeProject
          | undefined,
        python: this.runtime.python as
          | GeneratedPythonRuntimeProject
          | undefined,
        java: this.runtime.java as GeneratedJavaRuntimeProject | undefined,
      },
    });

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

    NxProject.ensure(infraProject).addImplicitDependency(this.model);

    if (!nxWorkspace) {
      // Add a task for the non-monorepo case to build the projects in the right order
      [
        this.model,
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
        "readme",
        "TYPE_SAFE_API.md"
      ),
    });
  }

  private getNxWorkspace = (
    options: TypeSafeApiProjectOptions
  ): NxWorkspace | undefined => {
    return options.parent ? NxWorkspace.of(options.parent) : undefined;
  };
}
