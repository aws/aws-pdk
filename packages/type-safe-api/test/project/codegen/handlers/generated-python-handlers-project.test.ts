/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedPythonHandlersProject } from "../../../../src/project/codegen/handlers/generated-python-handlers-project";
import { GeneratedPythonRuntimeProject } from "../../../../src/project/codegen/runtime/generated-python-runtime-project";
import { synthProject } from "../../snapshot-utils";

describe("Generated Python Handlers Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedPythonHandlersProject({
      outdir: path.resolve(__dirname, "python-handlers"),
      name: "test-python-handlers",
      moduleName: "test_handlers",
      authorEmail: "me@example.com",
      authorName: "test",
      version: "1.0.0",
      specPath: "my-spec.json",
      generatedPythonTypes: new GeneratedPythonRuntimeProject({
        outdir: path.resolve(__dirname, "python-client"),
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
