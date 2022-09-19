/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
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
