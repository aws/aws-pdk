/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedPythonAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-async-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Python Async Runtime Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedPythonAsyncRuntimeProject({
      outdir: path.resolve(__dirname, "python-async-runtime"),
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
