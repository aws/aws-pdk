/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import {
  Language,
  ModelLanguage,
  TypeSafeWebSocketApiModelProject,
} from "../../../src";
import { synthProject, synthSmithyProject } from "../snapshot-utils";

describe("Type Safe Api Model Project Unit Tests", () => {
  it("Smithy", () => {
    const project = new TypeSafeWebSocketApiModelProject({
      outdir: path.resolve(__dirname, "smithy-async-model"),
      name: "smithy-async-model",
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

  it("OpenAPI", () => {
    const project = new TypeSafeWebSocketApiModelProject({
      outdir: path.resolve(__dirname, "openapi-async-model"),
      name: "openapi-async-model",
      modelLanguage: ModelLanguage.OPENAPI,
      modelOptions: {
        openapi: {
          title: "MyService",
        },
      },
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("Smithy With Handlers", () => {
    const project = new TypeSafeWebSocketApiModelProject({
      outdir: path.resolve(__dirname, "smithy-async-handlers"),
      name: "smithy-async-handlers",
      modelLanguage: ModelLanguage.SMITHY,
      modelOptions: {
        smithy: {
          serviceName: {
            namespace: "com.test",
            serviceName: "MyService",
          },
        },
      },
      handlerLanguages: [Language.PYTHON, Language.TYPESCRIPT],
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("OpenAPI With Handlers", () => {
    const project = new TypeSafeWebSocketApiModelProject({
      outdir: path.resolve(__dirname, "openapi-async-handlers"),
      name: "openapi-async-handlers",
      modelLanguage: ModelLanguage.OPENAPI,
      modelOptions: {
        openapi: {
          title: "MyService",
        },
      },
      handlerLanguages: [Language.JAVA, Language.PYTHON],
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("Throws For Missing Smithy Options", () => {
    expect(() => {
      new TypeSafeWebSocketApiModelProject({
        outdir: path.resolve(__dirname, "smithy-async"),
        name: "smithy-async",
        modelLanguage: ModelLanguage.SMITHY,
        modelOptions: {},
      });
    }).toThrow(/modelOptions.smithy is required.*/);
  });

  it("Throws For Missing OpenAPI Options", () => {
    expect(() => {
      new TypeSafeWebSocketApiModelProject({
        outdir: path.resolve(__dirname, "openapi-async"),
        name: "openapi-async",
        modelLanguage: ModelLanguage.OPENAPI,
        modelOptions: {},
      });
    }).toThrow(/modelOptions.openapi is required.*/);
  });
});
