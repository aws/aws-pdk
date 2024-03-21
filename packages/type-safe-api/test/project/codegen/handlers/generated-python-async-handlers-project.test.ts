/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedPythonAsyncHandlersProject } from "../../../../src/project/codegen/handlers/generated-python-async-handlers-project";
import { GeneratedPythonAsyncRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-async-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Python Async Handlers Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedPythonAsyncHandlersProject({
      outdir: path.resolve(__dirname, "python-async-handlers"),
      name: "test-python-handlers",
      moduleName: "test_handlers",
      authorEmail: "me@example.com",
      authorName: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
      generatedPythonTypes: new GeneratedPythonAsyncRuntimeProject({
        outdir: path.resolve(__dirname, "python-async-client"),
        name: "test-python-client",
        moduleName: "test_client",
        authorEmail: "me@example.com",
        authorName: "test",
        version: "1.0.0",
        specPath: "my-spec.json",
      }),
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
