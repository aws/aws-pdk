/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import type { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { Project, ProjectOptions, SampleFile } from "projen";
import { JavaProject } from "projen/lib/java";
import { NodePackageManager } from "projen/lib/javascript";
import { PythonProject } from "projen/lib/python";
import { TypeScriptProject } from "projen/lib/typescript";
import {
  generateRuntimeProjects,
  generateDocsProjects,
  generateInfraProject,
} from "./codegen/generate";
import { GeneratedJavaRuntimeProject } from "./codegen/runtime/generated-java-runtime-project";
import { GeneratedPythonRuntimeProject } from "./codegen/runtime/generated-python-runtime-project";
import { GeneratedTypescriptRuntimeProject } from "./codegen/runtime/generated-typescript-runtime-project";
import { DocumentationFormat, Language } from "./languages";
import { TypeSafeApiModelProject } from "./model/type-safe-api-model-project";
import {
  GeneratedCodeOptions,
  GeneratedCodeProjects,
  ModelLanguage,
  ModelOptions,
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
  readonly options?: GeneratedCodeOptions;
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
  readonly options?: GeneratedCodeOptions;
}

/**
 * Configuration for generated documentation
 */
export interface DocumentationConfiguration {
  /**
   * Formats for generated documentation
   */
  readonly formats: DocumentationFormat[];
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
   * Generated runtime projects. When `runtime.languages` includes the corresponding language, the project can be
   * assumed to be defined.
   */
  public readonly runtime: GeneratedCodeProjects;
  /**
   * Generated infrastructure projects. Only the property corresponding to `infrastructure.language` will be defined.
   */
  public readonly infrastructure: GeneratedCodeProjects;

  constructor(options: TypeSafeApiProjectOptions) {
    super(options);

    const parentMonorepo = this.getParentMonorepo(options);

    // API Definition project containing the model
    const modelDir = "model";
    const modelProject = new TypeSafeApiModelProject({
      parent: parentMonorepo ?? this,
      outdir: parentMonorepo ? path.join(options.outdir!, modelDir) : modelDir,
      name: `${options.name}-model`,
      modelLanguage: options.model.language,
      modelOptions: options.model.options,
    });
    const parsedSpecPathRelativeToProjectRoot = path.join(
      modelDir,
      modelProject.parsedSpecFile
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
    const runtimeDirRelativeToParent = parentMonorepo
      ? path.join(options.outdir!, runtimeDir)
      : runtimeDir;

    // Declare the generated runtime projects
    const generatedRuntimeProjects = generateRuntimeProjects(runtimeLanguages, {
      parent: parentMonorepo ?? this,
      parentPackageName: this.name,
      generatedCodeDir: runtimeDirRelativeToParent,
      isWithinMonorepo: !!parentMonorepo,
      // Spec path relative to each generated client dir
      parsedSpecPath: path.join(
        "..",
        "..",
        parsedSpecPathRelativeToProjectRoot
      ),
      typescriptOptions: {
        // Try to infer monorepo default release branch, otherwise default to mainline unless overridden
        defaultReleaseBranch:
          parentMonorepo?.release?.branches?.[0] ?? "mainline",
        packageManager: parentMonorepo
          ? parentMonorepo.package.packageManager
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
    const docsDirRelativeToParent = parentMonorepo
      ? path.join(options.outdir!, docsDir)
      : docsDir;

    const generatedDocs = generateDocsProjects(documentationFormats, {
      parent: parentMonorepo ?? this,
      parentPackageName: this.name,
      generatedDocsDir: docsDirRelativeToParent,
      // Spec path relative to each generated doc format dir
      parsedSpecPath: path.join(
        "..",
        "..",
        parsedSpecPathRelativeToProjectRoot
      ),
    });

    // Ensure the generated runtime and docs projects have a dependency on the model project
    if (parentMonorepo) {
      [
        ...Object.values(generatedRuntimeProjects),
        ...Object.values(generatedDocs),
      ].forEach((project) => {
        parentMonorepo.addImplicitDependency(project, modelProject);
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

    const infraDir = "infrastructure";
    const infraDirRelativeToParent = parentMonorepo
      ? path.join(options.outdir!, infraDir)
      : infraDir;

    // Infrastructure project
    const infraProject = generateInfraProject(options.infrastructure.language, {
      parent: parentMonorepo ?? this,
      parentPackageName: this.name,
      generatedCodeDir: infraDirRelativeToParent,
      isWithinMonorepo: !!parentMonorepo,
      // Spec path relative to each generated infra package dir
      parsedSpecPath: path.join(
        "..",
        "..",
        parsedSpecPathRelativeToProjectRoot
      ),
      typescriptOptions: {
        // Try to infer monorepo default release branch, otherwise default to mainline unless overridden
        defaultReleaseBranch:
          parentMonorepo?.release?.branches?.[0] ?? "mainline",
        packageManager: parentMonorepo
          ? parentMonorepo.package.packageManager
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
        parentMonorepo?.addImplicitDependency?.(
          infraProject,
          this.runtime.java!
        );
        infraProjects.java = infraProject as JavaProject;
        break;
      case Language.PYTHON:
        parentMonorepo?.addImplicitDependency?.(
          infraProject,
          this.runtime.python!
        );
        infraProjects.python = infraProject as PythonProject;
        break;
      case Language.TYPESCRIPT:
        parentMonorepo?.addImplicitDependency?.(
          infraProject,
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

    parentMonorepo?.addImplicitDependency?.(infraProject, modelProject);

    if (!parentMonorepo) {
      // Add a task for the non-monorepo case to build the projects in the right order
      [
        modelProject,
        ...Object.values(generatedRuntimeProjects),
        infraProject,
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

  private getParentMonorepo = (
    options: TypeSafeApiProjectOptions
  ): NxMonorepoProject | undefined => {
    if (options.parent && "addImplicitDependency" in options.parent) {
      return options.parent as NxMonorepoProject;
    }
    return undefined;
  };
}
