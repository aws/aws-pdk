/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import {
  Language,
  OpenApiModelProject,
  SmithyModelProject,
  TypeSpecModelProject,
} from "../../../src";
import { synthProject, synthSmithyProject } from "../snapshot-utils";

describe("Type Safe Api Model Project Unit Tests", () => {
  it("Smithy", () => {
    const project = new SmithyModelProject({
      outdir: path.resolve(__dirname, "smithy-model"),
      name: "smithy-model",
      smithyOptions: {
        serviceName: {
          namespace: "com.test",
          serviceName: "MyService",
        },
      },
      parsedSpecFile: ".api.json",
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Smithy With Build Options", () => {
    const project = new SmithyModelProject({
      outdir: path.resolve(__dirname, "smithy-model-with-build-options"),
      name: "smithy-model-with-build-options",
      smithyOptions: {
        serviceName: {
          namespace: "com.test",
          serviceName: "MyService",
        },
        smithyBuildOptions: {
          additionalSources: [
            "foo/bar",
            path.resolve(__dirname, "some-other-directory"),
          ],
          projections: {
            openapi: {
              plugins: {
                openapi: {
                  forbidGreedyLabels: true,
                  ignoreUnsupportedTraits: true,
                },
              },
            },
          },
        },
      },
      parsedSpecFile: ".api.json",
    });

    project.definition.addSources(
      "yet/another",
      path.resolve(__dirname, "another-absolute")
    );

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Smithy With Dependencies", () => {
    const lib = new SmithyModelProject({
      outdir: path.resolve(__dirname, "smithy-model-lib"),
      name: "smithy-model-lib",
      smithyOptions: {
        serviceName: {
          namespace: "com.shared",
          serviceName: "Lib",
        },
      },
      parsedSpecFile: ".api.json",
    });
    const consumer = new SmithyModelProject({
      outdir: path.resolve(__dirname, "smithy-model-consumer"),
      name: "smithy-model-consumer",
      smithyOptions: {
        serviceName: {
          namespace: "com.test",
          serviceName: "Consumer",
        },
      },
      parsedSpecFile: ".api.json",
    });
    consumer.definition.addSmithyDeps(lib.definition);

    expect(synthSmithyProject(consumer)).toMatchSnapshot();
  });

  it("OpenAPI", () => {
    const project = new OpenApiModelProject({
      outdir: path.resolve(__dirname, "openapi-model"),
      name: "openapi-model",
      openApiOptions: {
        title: "MyService",
      },
      parsedSpecFile: ".api.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("Smithy With Handlers", () => {
    const project = new SmithyModelProject({
      outdir: path.resolve(__dirname, "smithy-handlers"),
      name: "smithy-handlers",
      smithyOptions: {
        serviceName: {
          namespace: "com.test",
          serviceName: "MyService",
        },
      },
      handlerLanguages: [Language.PYTHON, Language.TYPESCRIPT],
      parsedSpecFile: ".api.json",
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("OpenAPI With Handlers", () => {
    const project = new OpenApiModelProject({
      outdir: path.resolve(__dirname, "openapi-handlers"),
      name: "openapi-handlers",
      openApiOptions: {
        title: "MyService",
      },
      handlerLanguages: [Language.JAVA, Language.PYTHON],
      parsedSpecFile: ".api.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("TypeSpec", () => {
    const project = new TypeSpecModelProject({
      outdir: path.resolve(__dirname, "typespec"),
      name: "typespec",
      typeSpecOptions: {
        namespace: "MyService",
      },
      parsedSpecFile: ".api.json",
      defaultReleaseBranch: "mainline",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("TypeSpec with handlers", () => {
    const project = new TypeSpecModelProject({
      outdir: path.resolve(__dirname, "typespec-handlers"),
      name: "typespec-handlers",
      typeSpecOptions: {
        namespace: "MyService",
      },
      parsedSpecFile: ".api.json",
      defaultReleaseBranch: "mainline",
      handlerLanguages: [Language.TYPESCRIPT, Language.PYTHON],
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
