/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedJavaCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-java-cdk-infrastructure-project";
import { GeneratedJavaRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-java-runtime-project";
import { synthProject } from "../../../snapshot-utils";

describe("Generated Java Infra Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedJavaCdkInfrastructureProject({
      outdir: path.resolve(__dirname, "java-infra"),
      name: "test-java-infra",
      artifactId: "com.aws.pdk.test.client",
      groupId: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
      generatedJavaTypes: new GeneratedJavaRuntimeProject({
        outdir: path.resolve(__dirname, "java-client"),
        name: "test-java-client",
        artifactId: "com.aws.pdk.test.infra",
        groupId: "test",
        version: "1.0.0",
        specPath: "my-spec.json",
      }),
      generatedHandlers: {},
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
