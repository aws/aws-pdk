/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { GeneratedJavaAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-java-async-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Java Async Runtime Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedJavaAsyncRuntimeProject({
      outdir: path.resolve(__dirname, "java-async-runtime"),
      name: "test-java-runtime",
      artifactId: "com.aws.pdk.test",
      groupId: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
