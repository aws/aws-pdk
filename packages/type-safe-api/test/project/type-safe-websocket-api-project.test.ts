/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { MonorepoTsProject } from "@aws/monorepo";
import { NodePackageManager } from "projen/lib/javascript";
import { synthProject, synthSmithyProject } from "./snapshot-utils";
import {
  Language,
  ModelLanguage,
  TypeSafeWebSocketApiProject,
  WebSocketDocumentationFormat,
  WebSocketLibrary,
} from "../../src";

describe("Type Safe Api Project Unit Tests", () => {
  it.each([Language.TYPESCRIPT /*, Language.PYTHON, Language.JAVA*/])(
    "Smithy With %s Infra",
    (infrastructureLanguage) => {
      const project = new TypeSafeWebSocketApiProject({
        name: `smithy-${infrastructureLanguage}`,
        outdir: path.resolve(
          __dirname,
          `async-smithy-${infrastructureLanguage}`
        ),
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [/*Language.JAVA, Language.PYTHON,*/ Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            WebSocketDocumentationFormat.HTML,
            WebSocketDocumentationFormat.MARKDOWN,
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
      // expect(project.runtime.java).toBeDefined();
      // expect(project.runtime.python).toBeDefined();

      expect(synthSmithyProject(project)).toMatchSnapshot();
    }
  );

  it.each([Language.TYPESCRIPT /*, Language.PYTHON, Language.JAVA*/])(
    "OpenApi With %s Infra",
    (infrastructureLanguage) => {
      const project = new TypeSafeWebSocketApiProject({
        name: `openapi-${infrastructureLanguage}`,
        outdir: path.resolve(
          __dirname,
          `async-openapi-${infrastructureLanguage}`
        ),
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [/*Language.JAVA, Language.PYTHON,*/ Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            WebSocketDocumentationFormat.HTML,
            WebSocketDocumentationFormat.MARKDOWN,
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

  it.each([Language.TYPESCRIPT /*, Language.PYTHON, Language.JAVA*/])(
    "Smithy With %s Infra in Monorepo",
    (infrastructureLanguage) => {
      const monorepo = new MonorepoTsProject({
        name: "monorepo",
        outdir: path.resolve(
          __dirname,
          `async-monorepo-smithy-${infrastructureLanguage}`
        ),
        defaultReleaseBranch: "main",
      });

      new TypeSafeWebSocketApiProject({
        parent: monorepo,
        name: `smithy-${infrastructureLanguage}`,
        outdir: "packages/api",
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [/*Language.JAVA, Language.PYTHON,*/ Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            WebSocketDocumentationFormat.HTML,
            WebSocketDocumentationFormat.MARKDOWN,
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

  it.each([Language.TYPESCRIPT /*, Language.PYTHON, Language.JAVA*/])(
    "OpenApi With %s Infra in Monorepo",
    (infrastructureLanguage) => {
      const monorepo = new MonorepoTsProject({
        name: "monorepo",
        outdir: path.resolve(
          __dirname,
          `async-monorepo-openapi-${infrastructureLanguage}`
        ),
        defaultReleaseBranch: "main",
      });

      new TypeSafeWebSocketApiProject({
        parent: monorepo,
        name: `openapi-${infrastructureLanguage}`,
        outdir: "packages/api",
        infrastructure: {
          language: infrastructureLanguage,
        },
        runtime: {
          languages: [/*Language.JAVA, Language.PYTHON,*/ Language.TYPESCRIPT],
        },
        documentation: {
          formats: [
            WebSocketDocumentationFormat.HTML,
            WebSocketDocumentationFormat.MARKDOWN,
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
    const project = new TypeSafeWebSocketApiProject({
      name: `smithy-${packageManager}`,
      outdir: path.resolve(
        __dirname,
        `async-smithy-package-manager-${packageManager}`
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
          WebSocketDocumentationFormat.HTML,
          WebSocketDocumentationFormat.MARKDOWN,
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
        `async-monorepo-smithy-package-manager-${packageManager}`
      ),
      defaultReleaseBranch: "main",
    });

    new TypeSafeWebSocketApiProject({
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
          WebSocketDocumentationFormat.HTML,
          WebSocketDocumentationFormat.MARKDOWN,
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

  it("Smithy With TypeScript websocket hooks library", () => {
    const project = new TypeSafeWebSocketApiProject({
      name: `smithy-typescript-websocket-hooks`,
      outdir: path.resolve(
        __dirname,
        `async-smithy-typescript-websocket-hooks`
      ),
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
        libraries: [WebSocketLibrary.TYPESCRIPT_WEBSOCKET_HOOKS],
      },
    });

    expect(project.runtime.typescript).toBeDefined();
    expect(project.runtime.java).not.toBeDefined();
    expect(project.runtime.python).not.toBeDefined();

    expect(project.library.typescriptWebSocketHooks).toBeDefined();

    // Client should also be defined as hooks depend on it
    expect(project.library.typescriptWebSocketClient).toBeDefined();

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Smithy With Handlers", () => {
    const project = new TypeSafeWebSocketApiProject({
      name: `smithy-handlers`,
      outdir: path.resolve(__dirname, `async-smithy-handlers`),
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
        languages: [Language.TYPESCRIPT /*, Language.JAVA, Language.PYTHON*/],
      },
    });

    // Runtime languages should be added for each handler
    expect(project.runtime.typescript).toBeDefined();
    // expect(project.runtime.java).toBeDefined();
    // expect(project.runtime.python).toBeDefined();

    // Handlers should be present
    expect(project.handlers.typescript).toBeDefined();
    // expect(project.handlers.java).toBeDefined();
    // expect(project.handlers.python).toBeDefined();

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it.each([Language.TYPESCRIPT /*, Language.PYTHON, Language.JAVA*/])(
    "TypeSpec With %s Infra in Monorepo",
    (infrastructureLanguage) => {
      const monorepo = new MonorepoTsProject({
        name: "monorepo",
        outdir: path.resolve(
          __dirname,
          `async-monorepo-typespec-${infrastructureLanguage}`
        ),
        defaultReleaseBranch: "main",
      });

      new TypeSafeWebSocketApiProject({
        parent: monorepo,
        name: `typespec-${infrastructureLanguage}`,
        outdir: "packages/api",
        infrastructure: {
          language: infrastructureLanguage,
        },
        handlers: {
          languages: [/*Language.JAVA, Language.PYTHON,*/ Language.TYPESCRIPT],
        },
        model: {
          language: ModelLanguage.TYPESPEC,
          options: {
            typeSpec: {
              namespace: "MyService",
            },
          },
        },
      });

      expect(synthProject(monorepo)).toMatchSnapshot();
    }
  );

  // TODO: Remove this test and uncomment JAVA/PYTHON test cases above once support is added
  it.each([Language.JAVA, Language.PYTHON])(
    "Throws an error for language %s",
    (language) => {
      expect(() => {
        new TypeSafeWebSocketApiProject({
          name: `unsupported`,
          infrastructure: {
            language,
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
      }).toThrow(/.*not supported.*/);
    }
  );

  it("Throws For Missing Smithy Options", () => {
    expect(() => {
      new TypeSafeWebSocketApiProject({
        outdir: path.resolve(__dirname, "smithy-async"),
        name: "smithy-async",
        model: {
          language: ModelLanguage.SMITHY,
          options: {},
        },
        infrastructure: {
          language: Language.TYPESCRIPT,
        },
      });
    }).toThrow(/modelOptions.smithy is required.*/);
  });

  it("Throws For Missing OpenAPI Options", () => {
    expect(() => {
      new TypeSafeWebSocketApiProject({
        outdir: path.resolve(__dirname, "openapi-async"),
        name: "openapi-async",
        model: {
          language: ModelLanguage.OPENAPI,
          options: {},
        },
        infrastructure: {
          language: Language.TYPESCRIPT,
        },
      });
    }).toThrow(/modelOptions.openapi is required.*/);
  });

  it("Throws For Missing TypeSpec Options", () => {
    expect(() => {
      new TypeSafeWebSocketApiProject({
        outdir: path.resolve(__dirname, "typespec-async"),
        name: "typespec-async",
        model: {
          language: ModelLanguage.TYPESPEC,
          options: {},
        },
        infrastructure: {
          language: Language.TYPESCRIPT,
        },
      });
    }).toThrow(/modelOptions.typeSpec is required.*/);
  });
});
