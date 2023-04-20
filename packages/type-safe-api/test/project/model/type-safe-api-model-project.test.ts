/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { ModelLanguage, TypeSafeApiModelProject } from "../../../src";
import { synthProject, synthSmithyProject } from "../snapshot-utils";

describe("Type Safe Api Model Project Unit Tests", () => {
  it("Smithy", () => {
    const project = new TypeSafeApiModelProject({
      outdir: path.resolve(__dirname, "smithy-model"),
      name: "smithy-model",
      modelLanguage: ModelLanguage.SMITHY,
      modelOptions: {
        smithy: {
          serviceName: {
            namespace: "com.test",
            serviceName: "MyService",
          },
        },
      },
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Smithy With Build Options", () => {
    const project = new TypeSafeApiModelProject({
      outdir: path.resolve(__dirname, "smithy-model-with-build-options"),
      name: "smithy-model-with-build-options",
      modelLanguage: ModelLanguage.SMITHY,
      modelOptions: {
        smithy: {
          serviceName: {
            namespace: "com.test",
            serviceName: "MyService",
          },
          smithyBuildOptions: {
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
      },
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("Smithy With Dependencies", () => {
    const lib = new TypeSafeApiModelProject({
      outdir: path.resolve(__dirname, "smithy-model-lib"),
      name: "smithy-model-lib",
      modelLanguage: ModelLanguage.SMITHY,
      modelOptions: {
        smithy: {
          serviceName: {
            namespace: "com.shared",
            serviceName: "Lib",
          },
        },
      },
    });
    const consumer = new TypeSafeApiModelProject({
      outdir: path.resolve(__dirname, "smithy-model-consumer"),
      name: "smithy-model-consumer",
      modelLanguage: ModelLanguage.SMITHY,
      modelOptions: {
        smithy: {
          serviceName: {
            namespace: "com.test",
            serviceName: "Consumer",
          },
        },
      },
    });
    consumer.smithy!.addSmithyDeps(lib.smithy!);

    expect(synthSmithyProject(consumer)).toMatchSnapshot();
  });

  it("OpenAPI", () => {
    const project = new TypeSafeApiModelProject({
      outdir: path.resolve(__dirname, "openapi-model"),
      name: "openapi-model",
      modelLanguage: ModelLanguage.OPENAPI,
      modelOptions: {
        openapi: {
          title: "MyService",
        },
      },
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("Throws For Missing Smithy Options", () => {
    expect(() => {
      new TypeSafeApiModelProject({
        outdir: path.resolve(__dirname, "smithy"),
        name: "smithy",
        modelLanguage: ModelLanguage.SMITHY,
        modelOptions: {},
      });
    }).toThrowError(/modelOptions.smithy is required.*/);
  });

  it("Throws For Missing OpenAPI Options", () => {
    expect(() => {
      new TypeSafeApiModelProject({
        outdir: path.resolve(__dirname, "openapi"),
        name: "openapi",
        modelLanguage: ModelLanguage.OPENAPI,
        modelOptions: {},
      });
    }).toThrowError(/modelOptions.openapi is required.*/);
  });
});
