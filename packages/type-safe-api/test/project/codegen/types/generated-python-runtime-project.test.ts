/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedPythonRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Python Runtime Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedPythonRuntimeProject({
      outdir: path.resolve(__dirname, "python-runtime"),
      name: "test-python-runtime",
      moduleName: "test",
      authorEmail: "me@example.com",
      authorName: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
