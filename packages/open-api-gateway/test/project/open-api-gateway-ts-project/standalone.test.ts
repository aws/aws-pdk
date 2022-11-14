/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodePackageManager } from "projen/lib/javascript";
import { synthSnapshot } from "projen/lib/util/synth";
import { ClientLanguage, OpenApiGatewayTsProject } from "../../../src";

describe("OpenAPI Gateway Ts Standalone Unit Tests", () => {
  it.each([
    NodePackageManager.YARN,
    NodePackageManager.NPM,
    NodePackageManager.PNPM,
  ])("With Package Manager %s", (packageManager) => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [
        ClientLanguage.TYPESCRIPT,
        ClientLanguage.PYTHON,
        ClientLanguage.JAVA,
      ],
      packageManager,
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Honours Dependency Versions", () => {
    const project = new OpenApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [],
      deps: [
        "@aws-prototyping-sdk/open-api-gateway@0.10.2",
        "constructs@10.1.7",
        "aws-cdk-lib@2.39.0",
      ],
    });

    expect(
      project.deps.getDependency("@aws-prototyping-sdk/open-api-gateway")
        .version
    ).toBe("0.10.2");
    expect(project.deps.getDependency("constructs").version).toBe("10.1.7");
    expect(project.deps.getDependency("aws-cdk-lib").version).toBe("2.39.0");
  });
});
