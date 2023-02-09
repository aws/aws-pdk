/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { SmithyBuildProject } from "../../../src/project/smithy/smithy-build-project";
import { synthSmithyCodeProject } from "../smithy-test-utils";

describe("Smithy Build Project Tests", () => {
  it("Synth", () => {
    const project = new SmithyBuildProject({
      name: "test",
      serviceName: { namespace: "example.hello", serviceName: "Hello" },
      buildOutputDir: "output",
    });
    expect(synthSmithyCodeProject(project)).toMatchSnapshot();
  });

  it("Custom Dependencies And Repositories", () => {
    const project = new SmithyBuildProject({
      name: "test",
      serviceName: { namespace: "example.hello", serviceName: "Hello" },
      buildOutputDir: "output",
      smithyBuildOptions: {
        maven: {
          dependencies: [
            "software.amazon.smithy:smithy-aws-cloudformation:1.27.2",
          ],
          repositoryUrls: ["https://repo.maven.apache.org/maven2/"],
        },
      },
    });
    expect(synthSmithyCodeProject(project)).toMatchSnapshot();
  });

  it("Override Dependency Versions", () => {
    const project = new SmithyBuildProject({
      name: "test",
      serviceName: { namespace: "example.hello", serviceName: "Hello" },
      buildOutputDir: "output",
      smithyBuildOptions: {
        maven: {
          dependencies: [
            "software.amazon.smithy:smithy-cli:1.27.0",
            "software.amazon.smithy:smithy-model:1.27.0",
            "software.amazon.smithy:smithy-openapi:1.27.0",
            "software.amazon.smithy:smithy-aws-traits:1.27.0",
          ],
        },
      },
    });
    expect(synthSmithyCodeProject(project)).toMatchSnapshot();
  });
});
