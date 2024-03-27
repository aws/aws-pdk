/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedPythonAsyncCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-python-async-cdk-infrastructure-project";
import { GeneratedPythonAsyncRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-python-async-runtime-project";
import { synthProject } from "../../../snapshot-utils";

describe("Generated Python Async Infra Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedPythonAsyncCdkInfrastructureProject({
      outdir: path.resolve(__dirname, "python-async-infra"),
      name: "test-python-infra",
      moduleName: "test_infra",
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
      generatedHandlers: {},
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
