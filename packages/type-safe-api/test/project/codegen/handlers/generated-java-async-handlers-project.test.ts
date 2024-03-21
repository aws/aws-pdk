/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedJavaAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-java-async-handlers-project";
import { GeneratedJavaAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-java-async-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Java Async Handlers Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedJavaAsyncHandlersProject({
      outdir: path.resolve(__dirname, "java-async-handlers"),
      name: "test-java-handlers",
      artifactId: "com.aws.pdk.test.handlers",
      groupId: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
      generatedJavaTypes: new GeneratedJavaAsyncRuntimeProject({
        outdir: path.resolve(__dirname, "java-async-client"),
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
