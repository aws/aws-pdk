/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import path from "path";
import { GeneratedPythonCdkInfrastructureProject } from "../../../../../src/project/codegen/infrastructure/cdk/generated-python-cdk-infrastructure-project";
import { GeneratedPythonRuntimeProject } from "../../../../../src/project/codegen/runtime/generated-python-runtime-project";
import { synthProject } from "../../../snapshot-utils";

describe("Generated Python Infra Code Unit Tests", () => {
  it("Synth", () => {
    const project = new GeneratedPythonCdkInfrastructureProject({
      outdir: path.resolve(__dirname, "python-infra"),
      name: "test-python-infra",
      moduleName: "test_infra",
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
      generatedHandlers: {},
    });

    expect(synthProject(project)).toMatchSnapshot();
  });
});
