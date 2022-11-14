/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { synthSnapshot } from "projen/lib/util/synth";
import {
  ClientLanguage,
  OpenApiGatewayJavaProject,
} from "../../../src/project";

describe("OpenAPI Gateway Java Monorepo Unit Tests", () => {
  it("Within Monorepo With Package Manager %s", () => {
    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "@test/monorepo",
    });
    new OpenApiGatewayJavaProject({
      parent: monorepo,
      outdir: "packages/my-api",
      name: "myapi",
      groupId: "software.aws.test",
      artifactId: "my-api",
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
