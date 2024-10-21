/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { MonorepoTsProject } from "@aws/monorepo";
import {
  DocumentationFormat,
  Language,
  Library,
  ModelLanguage,
  TypeSafeApiProject,
} from "@aws/type-safe-api";
import { synthSnapshot } from "projen/lib/util/synth";
import { CloudscapeReactTsWebsiteProject } from "../src";

describe("CloudscapeReactTsWebsiteProject Unit Tests", () => {
  it("Defaults", () => {
    const project = new CloudscapeReactTsWebsiteProject({
      defaultReleaseBranch: "mainline",
      name: "Defaults",
      applicationName: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Custom Options", () => {
    const project = new CloudscapeReactTsWebsiteProject({
      defaultReleaseBranch: "mainline",
      name: "CustomOptions",
      applicationName: "CustomOptions",
      deps: ["aws-prototoyping-sdk"],
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("With TypeSafeApi", () => {
    const monorepo = new MonorepoTsProject({
      name: "monorepo",
      defaultReleaseBranch: "main",
    });

    const tsApi = new TypeSafeApiProject({
      parent: monorepo,
      outdir: "packages/api",
      name: "testapi",
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      runtime: {
        languages: [Language.JAVA, Language.PYTHON, Language.TYPESCRIPT],
      },
      documentation: {
        formats: [
          DocumentationFormat.MARKDOWN,
          DocumentationFormat.PLANTUML,
          DocumentationFormat.HTML_REDOC,
        ],
      },
      library: {
        libraries: [Library.TYPESCRIPT_REACT_QUERY_HOOKS],
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

    const project = new CloudscapeReactTsWebsiteProject({
      parent: monorepo,
      outdir: "packages/website",
      defaultReleaseBranch: "mainline",
      name: "WithAPI",
      applicationName: "WithAPI",
      typeSafeApi: tsApi,
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("With TypeSafeApi - No Library", () => {
    const tsApi = new TypeSafeApiProject({
      name: "testapi",
      infrastructure: {
        language: Language.TYPESCRIPT,
      },
      runtime: {
        languages: [Language.JAVA, Language.PYTHON, Language.TYPESCRIPT],
      },
      documentation: {
        formats: [
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

    expect(
      () =>
        new CloudscapeReactTsWebsiteProject({
          defaultReleaseBranch: "mainline",
          name: "WithAPI",
          applicationName: "WithAPI",
          typeSafeApi: tsApi,
        })
    ).toThrowErrorMatchingSnapshot();
  });
});
