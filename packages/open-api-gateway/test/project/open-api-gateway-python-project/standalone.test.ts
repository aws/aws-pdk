/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { synthSnapshot } from "projen/lib/util/synth";
import { ClientLanguage, OpenApiGatewayPythonProject } from "../../../src";

describe("OpenAPI Gateway Python Standalone Unit Tests", () => {
  it("Standalone", () => {
    const project = new OpenApiGatewayPythonProject({
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
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Honours Dependency Versions", () => {
    const project = new OpenApiGatewayPythonProject({
      moduleName: "my_api",
      name: "my_api",
      authorName: "test",
      authorEmail: "test@example.com",
      version: "1.0.0",
      clientLanguages: [],
      deps: [
        "aws_prototyping_sdk.open_api_gateway@0.10.2",
        "constructs@10.1.7",
        "aws-cdk-lib@2.39.0",
      ],
    });

    expect(
      project.deps.getDependency("aws_prototyping_sdk.open_api_gateway").version
    ).toBe("0.10.2");
    expect(project.deps.getDependency("constructs").version).toBe("10.1.7");
    expect(project.deps.getDependency("aws-cdk-lib").version).toBe("2.39.0");
  });
});
