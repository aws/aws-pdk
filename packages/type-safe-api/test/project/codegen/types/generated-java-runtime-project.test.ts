/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as path from "path";
import { GeneratedJavaRuntimeProject } from "../../../../src/project/codegen/runtime/generated-java-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Java Runtime Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedJavaRuntimeProject({
      outdir: path.resolve(__dirname, "java-runtime"),
      name: "test-java-runtime",
      artifactId: "com.aws.pdk.test",
      groupId: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
