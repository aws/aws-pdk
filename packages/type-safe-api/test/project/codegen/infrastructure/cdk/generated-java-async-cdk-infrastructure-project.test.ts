/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedJavaAsyncCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-java-async-cdk-infrastructure-project";
import { GeneratedJavaAsyncRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-java-async-runtime-project";
import { synthProject } from "../../../snapshot-utils";

describe("Generated Java Async Infra Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedJavaAsyncCdkInfrastructureProject({
      outdir: path.resolve(__dirname, "java-async-infra"),
      name: "test-java-infra",
      artifactId: "com.aws.pdk.test.client",
      groupId: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
      generatedJavaTypes: new GeneratedJavaAsyncRuntimeProject({
        outdir: path.resolve(__dirname, "java-async-client"),
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
