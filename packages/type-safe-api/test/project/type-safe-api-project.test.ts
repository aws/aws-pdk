/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { MonorepoTsProject } from "@aws/monorepo";
import { NodePackageManager } from "projen/lib/javascript";
import { synthProject, synthSmithyProject } from "./snapshot-utils";
import {
  DocumentationFormat,
  GeneratedTypeScriptInfrastructureOptions,
  GeneratedTypeScriptReactQueryHooksOptions,
  GeneratedTypeScriptRuntimeOptions,
  Language,
  Library,
  ModelLanguage,
  OpenApiGeneratorCliConfig,
  TypeSafeApiProject,
} from "../../src";

describe("Type Safe Api Project Unit Tests", () => {
  it.each([Language.TYPESCRIPT, Language.PYTHON, Language.JAVA])(
    "Smithy With %s Infra",
    (infrastructureLanguage) => {
      const project = new TypeSafeApiProject({
        name: `smithy-${infrastructureLanguage}`,
        outdir: path.resolve(__dirname, `smithy-${infrastructureLanguage}`),
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [Language.JAVA, Language.PYTHON, Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            DocumentationFormat.HTML2,
            DocumentationFormat.MARKDOWN,
            DocumentationFormat.PLANTUML,
            DocumentationFormat.HTML_REDOC,
          ],
        },
        model: {
          language: ModelLanguage.SMITHY,
          options: {
            smithy: {
              serviceName: {
                namespace: "com.test",
                serviceName: "MyService",
              },
            },
          },
        },
      });

      expect(project.runtime.typescript).toBeDefined();
      expect(project.runtime.java).toBeDefined();
      expect(project.runtime.python).toBeDefined();

      expect(synthSmithyProject(project)).toMatchSnapshot();
    }
  );

  it.each([Language.TYPESCRIPT, Language.PYTHON, Language.JAVA])(
    "OpenApi With %s Infra",
    (infrastructureLanguage) => {
      const project = new TypeSafeApiProject({
        name: `openapi-${infrastructureLanguage}`,
        outdir: path.resolve(__dirname, `openapi-${infrastructureLanguage}`),
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [Language.JAVA, Language.PYTHON, Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            DocumentationFormat.HTML2,
            DocumentationFormat.MARKDOWN,
            DocumentationFormat.PLANTUML,
            DocumentationFormat.HTML_REDOC,
          ],
        },
        model: {
          language: ModelLanguage.OPENAPI,
          options: {
            openapi: {
              title: "MyService",
            },
          },
        },
      });

      expect(synthProject(project)).toMatchSnapshot();
    }
  );

  it.each([Language.TYPESCRIPT, Language.PYTHON, Language.JAVA])(
    "Smithy With %s Infra in Monorepo",
    (infrastructureLanguage) => {
      const monorepo = new MonorepoTsProject({
        name: "monorepo",
        outdir: path.resolve(
          __dirname,
          `monorepo-smithy-${infrastructureLanguage}`
        ),
        defaultReleaseBranch: "main",
      });

      new TypeSafeApiProject({
        parent: monorepo,
        name: `smithy-${infrastructureLanguage}`,
        outdir: "packages/api",
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [Language.JAVA, Language.PYTHON, Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            DocumentationFormat.HTML2,
            DocumentationFormat.MARKDOWN,
            DocumentationFormat.PLANTUML,
            DocumentationFormat.HTML_REDOC,
          ],
        },
        model: {
          language: ModelLanguage.SMITHY,
          options: {
            smithy: {
              serviceName: {
                namespace: "com.test",
                serviceName: "MyService",
              },
            },
          },
        },
      });

      expect(synthSmithyProject(monorepo)).toMatchSnapshot();
    }
  );

  it.each([Language.TYPESCRIPT, Language.PYTHON, Language.JAVA])(
    "OpenApi With %s Infra in Monorepo",
    (infrastructureLanguage) => {
      const monorepo = new MonorepoTsProject({
        name: "monorepo",
        outdir: path.resolve(
          __dirname,
          `monorepo-openapi-${infrastructureLanguage}`
        ),
        defaultReleaseBranch: "main",
      });

      new TypeSafeApiProject({
        parent: monorepo,
        name: `openapi-${infrastructureLanguage}`,
        outdir: "packages/api",
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [Language.JAVA, Language.PYTHON, Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            DocumentationFormat.HTML2,
            DocumentationFormat.MARKDOWN,
            DocumentationFormat.PLANTUML,
            DocumentationFormat.HTML_REDOC,
          ],
        },
        model: {
          language: ModelLanguage.OPENAPI,
          options: {
            openapi: {
              title: "MyService",
            },
          },
        },
      });

      expect(synthProject(monorepo)).toMatchSnapshot();
    }
  );

  it.each([
    NodePackageManager.NPM,
    NodePackageManager.YARN_CLASSIC,
    NodePackageManager.YARN_BERRY,
    NodePackageManager.PNPM,
  ])("Smithy With %s Package Manager", (packageManager) => {
    const project = new TypeSafeApiProject({
      name: `smithy-${packageManager}`,
      outdir: path.resolve(
        __dirname,
        `smithy-package-manager-${packageManager}`
      ),
      infrastructure: {
        language: Language.TYPESCRIPT,
        options: {
          typescript: {
            name: "my-ts-infra",
            defaultReleaseBranch: "main",
            packageManager,
          },
        },
      },
      runtime: {
        languages: [Language.TYPESCRIPT],
      },
      documentation: {
        formats: [
          DocumentationFormat.HTML2,
          DocumentationFormat.MARKDOWN,
          DocumentationFormat.PLANTUML,
          DocumentationFormat.HTML_REDOC,
        ],
      },
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.test",
              serviceName: "MyService",
            },
          },
        },
      },
    });

    expect(project.runtime.typescript).toBeDefined();
    expect(project.runtime.java).not.toBeDefined();
    expect(project.runtime.python).not.toBeDefined();

    expect(project.infrastructure.typescript).toBeDefined();
    expect(project.infrastructure.java).not.toBeDefined();
    expect(project.infrastructure.python).not.toBeDefined();

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it.each([
    NodePackageManager.NPM,
    NodePackageManager.YARN_CLASSIC,
    NodePackageManager.YARN_BERRY,
    NodePackageManager.PNPM,
  ])("Smithy With %s Package Manager in Monorepo", (packageManager) => {
    const monorepo = new MonorepoTsProject({
      name: "monorepo",
      packageManager,
      outdir: path.resolve(
        __dirname,
        `monorepo-smithy-package-manager-${packageManager}`
      ),
      defaultReleaseBranch: "main",
    });

    new TypeSafeApiProject({
      parent: monorepo,
      name: `smithy-${packageManager}`,
      outdir: "packages/api",
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      runtime: {
        languages: [Language.TYPESCRIPT],
      },
      documentation: {
        formats: [
          DocumentationFormat.HTML2,
          DocumentationFormat.MARKDOWN,
          DocumentationFormat.PLANTUML,
          DocumentationFormat.HTML_REDOC,
        ],
      },
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.test",
              serviceName: "MyService",
            },
          },
        },
      },
    });

    expect(synthSmithyProject(monorepo)).toMatchSnapshot();
  });

  it("Smithy With TypeScript react-query hooks library", () => {
    const project = new TypeSafeApiProject({
      name: `smithy-typescript-react-query-hooks`,
      outdir: path.resolve(__dirname, `smithy-typescript-react-query-hooks`),
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      runtime: {
        languages: [Language.TYPESCRIPT],
      },
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.test",
              serviceName: "MyService",
            },
          },
        },
      },
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
      },
    });

    expect(project.runtime.typescript).toBeDefined();
    expect(project.runtime.java).not.toBeDefined();
    expect(project.runtime.python).not.toBeDefined();

    expect(project.library.typescriptReactQueryHooks).toBeDefined();

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Smithy With Handlers", () => {
    const project = new TypeSafeApiProject({
      name: `smithy-handlers`,
      outdir: path.resolve(__dirname, `smithy-handlers`),
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      runtime: {
        languages: [Language.TYPESCRIPT],
      },
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.test",
              serviceName: "MyService",
            },
          },
        },
      },
      handlers: {
        languages: [Language.TYPESCRIPT, Language.JAVA, Language.PYTHON],
      },
    });

    // Runtime languages should be added for each handler
    expect(project.runtime.typescript).toBeDefined();
    expect(project.runtime.java).toBeDefined();
    expect(project.runtime.python).toBeDefined();

    // Handlers should be present
    expect(project.handlers.typescript).toBeDefined();
    expect(project.handlers.java).toBeDefined();
    expect(project.handlers.python).toBeDefined();

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Custom OpenAPI Generator CLI Configuration", () => {
    const openApiGeneratorCliConfig: OpenApiGeneratorCliConfig = {
      version: "6.2.0",
      storageDir: "~/.my-storage-dir",
      repository: {
        downloadUrl:
          "https://my.custom.maven.repo/maven2/${groupId}/${artifactId}/${versionName}/${artifactId}-${versionName}.jar",
      },
      useDocker: true,
    };

    const project = new TypeSafeApiProject({
      name: `custom-openapi-generator-cli-configuration`,
      outdir: path.resolve(
        __dirname,
        `custom-openapi-generator-cli-configuration`
      ),
      infrastructure: {
        language: Language.TYPESCRIPT,
        options: {
          typescript: {
            openApiGeneratorCliConfig,
          } satisfies Partial<GeneratedTypeScriptInfrastructureOptions> as any,
        },
      },
      runtime: {
        languages: [Language.TYPESCRIPT],
        options: {
          typescript: {
            openApiGeneratorCliConfig,
          } satisfies Partial<GeneratedTypeScriptRuntimeOptions> as any,
        },
      },
      model: {
        language: ModelLanguage.SMITHY,
        options: {
          smithy: {
            serviceName: {
              namespace: "com.test",
              serviceName: "MyService",
            },
          },
        },
      },
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
        options: {
          typescriptReactQueryHooks: {
            openApiGeneratorCliConfig,
          } satisfies Partial<GeneratedTypeScriptReactQueryHooksOptions> as any,
        },
      },
      documentation: {
        formats: [DocumentationFormat.HTML2],
        options: {
          html2: {
            openApiGeneratorCliConfig,
          },
        },
      },
    });

    expect(project.runtime.typescript).toBeDefined();
    expect(project.runtime.java).not.toBeDefined();
    expect(project.runtime.python).not.toBeDefined();

    expect(project.library.typescriptReactQueryHooks).toBeDefined();

    expect(project.documentation.html2).toBeDefined();

    const snapshot = synthSmithyProject(project);

    expect(
      snapshot[
        `${path.relative(
          project.outdir,
          project.infrastructure.typescript!.outdir
        )}/.pdk/dynamic-files/openapitools.json`
      ]
    ).toMatchSnapshot();
    expect(
      snapshot[
        `${path.relative(
          project.outdir,
          project.runtime.typescript!.outdir
        )}/.pdk/dynamic-files/openapitools.json`
      ]
    ).toMatchSnapshot();
    expect(
      snapshot[
        `${path.relative(
          project.outdir,
          project.library.typescriptReactQueryHooks!.outdir
        )}/.pdk/dynamic-files/openapitools.json`
      ]
    ).toMatchSnapshot();
    expect(
      snapshot[
        `${path.relative(
          project.outdir,
          project.documentation.html2!.outdir
        )}/.pdk/dynamic-files/openapitools.json`
      ]
    ).toMatchSnapshot();
  });

  it("commitGeneratedCode includes generated code", () => {
    const project = new TypeSafeApiProject({
      name: `openapi-commitAll`,
      outdir: path.resolve(__dirname, `openapi-commitAll`),
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      runtime: {
        languages: [Language.PYTHON, Language.TYPESCRIPT],
      },
      model: {
        language: ModelLanguage.OPENAPI,
        options: {
          openapi: {
            title: "MyService",
          },
        },
      },
      commitGeneratedCode: true,
    });

    const snapshot = synthProject(project);
    expect(
      (
        snapshot[
          `${path.relative(
            project.outdir,
            project.infrastructure.typescript!.outdir
          )}/.gitignore`
        ] as string
      ).split("\n")
    ).toEqual(
      expect.not.arrayContaining([project.infrastructure.typescript!.srcdir])
    );
    expect(
      (
        snapshot[
          `${path.relative(
            project.outdir,
            project.runtime.python!.outdir
          )}/.gitignore`
        ] as string
      ).split("\n")
    ).toEqual(
      expect.not.arrayContaining([
        "README.md",
        project.runtime.python!.moduleName,
      ])
    );
  });

  it("commitGeneratedCode override in subproject", () => {
    const project = new TypeSafeApiProject({
      name: `openapi-commitOverride`,
      outdir: path.resolve(__dirname, `openapi-commitOverride`),
      infrastructure: {
        language: Language.TYPESCRIPT,
        options: {
          typescript: {
            commitGeneratedCode: false,
          },
        },
      },
      runtime: {
        languages: [Language.PYTHON, Language.TYPESCRIPT],
      },
      model: {
        language: ModelLanguage.OPENAPI,
        options: {
          openapi: {
            title: "MyService",
          },
        },
      },
      commitGeneratedCode: true,
    });

    const snapshot = synthProject(project);
    expect(
      (
        snapshot[
          `${path.relative(
            project.outdir,
            project.infrastructure.typescript!.outdir
          )}/.gitignore`
        ] as string
      ).split("\n")
    ).toEqual(
      expect.arrayContaining([project.infrastructure.typescript!.srcdir])
    );
    expect(
      (
        snapshot[
          `${path.relative(
            project.outdir,
            project.runtime.python!.outdir
          )}/.gitignore`
        ] as string
      ).split("\n")
    ).toEqual(
      expect.not.arrayContaining([
        "README.md",
        project.runtime.python!.moduleName,
      ])
    );
  });

  it("commitGeneratedCode only python runtime", () => {
    const project = new TypeSafeApiProject({
      name: `openapi-commitRuntime`,
      outdir: path.resolve(__dirname, `openapi-commitRuntime`),
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      runtime: {
        languages: [Language.PYTHON, Language.TYPESCRIPT],
        options: {
          python: {
            commitGeneratedCode: true,
          },
        },
      },
      model: {
        language: ModelLanguage.OPENAPI,
        options: {
          openapi: {
            title: "MyService",
          },
        },
      },
    });

    const snapshot = synthProject(project);
    expect(
      (
        snapshot[
          `${path.relative(
            project.outdir,
            project.infrastructure.typescript!.outdir
          )}/.gitignore`
        ] as string
      ).split("\n")
    ).toEqual(
      expect.arrayContaining([project.infrastructure.typescript!.srcdir])
    );
    expect(
      (
        snapshot[
          `${path.relative(
            project.outdir,
            project.runtime.python!.outdir
          )}/.gitignore`
        ] as string
      ).split("\n")
    ).toEqual(
      expect.not.arrayContaining([
        "README.md",
        project.runtime.python!.moduleName,
      ])
    );
  });
});
