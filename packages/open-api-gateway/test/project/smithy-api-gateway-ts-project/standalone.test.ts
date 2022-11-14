/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { NodePackageManager } from "projen/lib/javascript";
import { ClientLanguage, SmithyApiGatewayTsProject } from "../../../src";
import { synthSmithyCodeProject } from "../smithy-test-utils";

describe("Smithy Api Gateway Ts Standalone Unit Tests", () => {
  it.each([
    NodePackageManager.YARN,
    NodePackageManager.NPM,
    NodePackageManager.PNPM,
  ])("With Package Manager %s", (packageManager) => {
    const project = new SmithyApiGatewayTsProject({
      defaultReleaseBranch: "mainline",
      name: "@test/my-api",
      clientLanguages: [
        ClientLanguage.TYPESCRIPT,
        ClientLanguage.PYTHON,
        ClientLanguage.JAVA,
      ],
      packageManager,
      serviceName: { namespace: "example.hello", serviceName: "Hello" },
    });
    expect(synthSmithyCodeProject(project)).toMatchSnapshot();
  });
});
