/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import {
  Language,
  OpenApiAsyncModelProject,
  SmithyAsyncModelProject,
  TypeSpecAsyncModelProject,
} from "../../../src";
import { synthProject, synthSmithyProject } from "../snapshot-utils";

describe("Type Safe Api Model Project Unit Tests", () => {
  it("Smithy", () => {
    const project = new SmithyAsyncModelProject({
      outdir: path.resolve(__dirname, "smithy-async-model"),
      name: "smithy-async-model",
      smithyOptions: {
        serviceName: {
          namespace: "com.test",
          serviceName: "MyService",
        },
      },
      parsedSpecFile: ".api.json",
      asyncApiSpecFile: ".asyncapi.json",
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("OpenAPI", () => {
    const project = new OpenApiAsyncModelProject({
      outdir: path.resolve(__dirname, "openapi-async-model"),
      name: "openapi-async-model",
      openApiOptions: {
        title: "MyService",
      },
      parsedSpecFile: ".api.json",
      asyncApiSpecFile: ".asyncapi.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("Smithy With Handlers", () => {
    const project = new SmithyAsyncModelProject({
      outdir: path.resolve(__dirname, "smithy-async-handlers"),
      name: "smithy-async-handlers",
      smithyOptions: {
        serviceName: {
          namespace: "com.test",
          serviceName: "MyService",
        },
      },
      handlerLanguages: [Language.PYTHON, Language.TYPESCRIPT],
      parsedSpecFile: ".api.json",
      asyncApiSpecFile: ".asyncapi.json",
    });

    expect(synthSmithyProject(project)).toMatchSnapshot();
  });

  it("OpenAPI With Handlers", () => {
    const project = new OpenApiAsyncModelProject({
      outdir: path.resolve(__dirname, "openapi-async-handlers"),
      name: "openapi-async-handlers",
      openApiOptions: {
        title: "MyService",
      },
      handlerLanguages: [Language.JAVA, Language.PYTHON],
      parsedSpecFile: ".api.json",
      asyncApiSpecFile: ".asyncapi.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("TypeSpec", () => {
    const project = new TypeSpecAsyncModelProject({
      outdir: path.resolve(__dirname, "typespec-async"),
      name: "typespec-async",
      typeSpecOptions: {
        namespace: "MyService",
      },
      parsedSpecFile: ".api.json",
      asyncApiSpecFile: ".asyncapi.json",
      defaultReleaseBranch: "mainline",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });

  it("TypeSpec with handlers", () => {
    const project = new TypeSpecAsyncModelProject({
      outdir: path.resolve(__dirname, "typespec-async-handlers"),
      name: "typespec-async-handlers",
      typeSpecOptions: {
        namespace: "MyService",
      },
      parsedSpecFile: ".api.json",
      asyncApiSpecFile: ".asyncapi.json",
      defaultReleaseBranch: "mainline",
      handlerLanguages: [Language.PYTHON, Language.JAVA],
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
