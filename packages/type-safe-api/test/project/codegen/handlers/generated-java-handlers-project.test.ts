/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedJavaHandlersProject } from "../../../../src/project/codegen/handlers/generated-java-handlers-project";
import { GeneratedJavaRuntimeProject } from "../../../../src/project/codegen/runtime/generated-java-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Java Handlers Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedJavaHandlersProject({
      outdir: path.resolve(__dirname, "java-handlers"),
      name: "test-java-handlers",
      artifactId: "com.aws.pdk.test.handlers",
      groupId: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
      generatedJavaTypes: new GeneratedJavaRuntimeProject({
        outdir: path.resolve(__dirname, "java-client"),
        name: "test-java-client",
        artifactId: "com.aws.pdk.test.runtime",
        groupId: "test",
        version: "1.0.0",
        specPath: "my-spec.json",
      }),
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
