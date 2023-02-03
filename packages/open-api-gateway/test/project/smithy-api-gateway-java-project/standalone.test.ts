/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { SmithyApiGatewayJavaProject } from "../../../src";
import { synthSmithyCodeProject } from "../smithy-test-utils";

describe("Smithy Api Gateway Java Standalone Unit Tests", () => {
  it("Synth", () => {
    const project = new SmithyApiGatewayJavaProject({
      artifactId: "test",
      groupId: "com.test",
      version: "1.0.0",
      name: "test",
      clientLanguages: [],
      serviceName: { namespace: "example.hello", serviceName: "Hello" },
    });
    expect(synthSmithyCodeProject(project)).toMatchSnapshot();
  });
});
