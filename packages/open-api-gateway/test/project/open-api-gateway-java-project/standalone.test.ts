/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { synthSnapshot } from "projen/lib/util/synth";
import { ClientLanguage, OpenApiGatewayJavaProject } from "../../../src";

describe("OpenAPI Gateway Java Standalone Unit Tests", () => {
  it("Standalone", () => {
    const project = new OpenApiGatewayJavaProject({
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
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Honours Dependency Versions", () => {
    const project = new OpenApiGatewayJavaProject({
      name: "myapi",
      groupId: "software.aws.test",
      artifactId: "my-api",
      version: "1.0.0",
      clientLanguages: [],
      deps: [
        "software.aws.awsprototypingsdk/open-api-gateway@0.10.2",
        "software.constructs/constructs@10.1.7",
        "software.amazon.awscdk/aws-cdk-lib@2.39.0",
      ],
    });

    expect(
      project.deps.getDependency(
        "software.aws.awsprototypingsdk/open-api-gateway"
      ).version
    ).toBe("0.10.2");
    expect(
      project.deps.getDependency("software.constructs/constructs").version
    ).toBe("10.1.7");
    expect(
      project.deps.getDependency("software.amazon.awscdk/aws-cdk-lib").version
    ).toBe("2.39.0");
  });
});
