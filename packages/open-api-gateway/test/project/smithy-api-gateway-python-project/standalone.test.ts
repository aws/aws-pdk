/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { SmithyApiGatewayPythonProject } from "../../../src";
import { synthSmithyCodeProject } from "../smithy-test-utils";

describe("Smithy Api Gateway Python Standalone Unit Tests", () => {
  it("Synth", () => {
    const project = new SmithyApiGatewayPythonProject({
      authorEmail: "test@test.test",
      authorName: "test",
      moduleName: "test",
      version: "1.0.0",
      name: "test",
      clientLanguages: [],
      serviceName: { namespace: "example.hello", serviceName: "Hello" },
    });
    expect(synthSmithyCodeProject(project)).toMatchSnapshot();
  });
});
