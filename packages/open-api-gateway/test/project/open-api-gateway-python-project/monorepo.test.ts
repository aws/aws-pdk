/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { synthSnapshot } from "projen/lib/util/synth";
import {
  ClientLanguage,
  OpenApiGatewayPythonProject,
} from "../../../src/project";

describe("OpenAPI Gateway Python Monorepo Unit Tests", () => {
  it("Within Monorepo With Package Manager %s", () => {
    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "@test/monorepo",
    });
    new OpenApiGatewayPythonProject({
      parent: monorepo,
      outdir: "packages/my_api",
      moduleName: "my_api",
      name: "my_api",
      authorName: "test",
      authorEmail: "test@example.com",
      version: "1.0.0",
      clientLanguages: [
        ClientLanguage.TYPESCRIPT,
        ClientLanguage.PYTHON,
        ClientLanguage.JAVA,
      ],
    });
    expect(synthSnapshot(monorepo)).toMatchSnapshot();
  });
});
