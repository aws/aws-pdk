/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { synthSnapshot } from "projen/lib/util/synth";
import { CloudscapeReactTsWebsiteProject } from "../src";

describe("CloudscapeReactTsWebsiteProject Unit Tests", () => {
  it("Defaults", () => {
    const project = new CloudscapeReactTsWebsiteProject({
      defaultReleaseBranch: "mainline",
      name: "Defaults",
      applicationName: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("Custom Options", () => {
    const project = new CloudscapeReactTsWebsiteProject({
      defaultReleaseBranch: "mainline",
      name: "CustomOptions",
      applicationName: "CustomOptions",
      deps: ["aws-prototoyping-sdk"],
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });
});
