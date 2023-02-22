/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { SmithyApiGatewayTsProject } from "../../../src/project";
import { synthSmithyCodeProject } from "../smithy-test-utils";

describe("Smithy Api Gateway Ts Build Options Test", () => {
  it("With Options", () => {
    const monorepo = new NxMonorepoProject({
      defaultReleaseBranch: "mainline",
      name: "@test/monorepo",
    });
    new SmithyApiGatewayTsProject({
      parent: monorepo,
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [],
      outdir: "packages/api",
      serviceName: { namespace: "my.test.service", serviceName: "TestService" },
      smithyBuildOptions: {
        projections: {
          openapi: {
            plugins: {
              openapi: {
                forbidGreedyLabels: true,
                ignoreUnsupportedTraits: true,
              },
            },
          },
        },
      },
    });
    expect(synthSmithyCodeProject(monorepo)).toMatchSnapshot();
  });
});
