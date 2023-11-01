/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Language } from "@aws/type-safe-api";
import { synthSnapshot } from "projen/lib/util/synth";
import {
  InfrastructureJavaProject,
  InfrastructureJavaProjectOptions,
} from "../../../src";
import {
  BuildOptionsProps,
  snapshotInfrastructureProject,
} from "../utils/snapshot-infra-project";

describe("InfrastructureJavaProject", () => {
  const snapshot = (
    buildOptions: (props: BuildOptionsProps) => InfrastructureJavaProjectOptions
  ) =>
    snapshotInfrastructureProject(
      Language.JAVA,
      InfrastructureJavaProject,
      buildOptions
    );

  it("Defaults", () => {
    const project = new InfrastructureJavaProject({
      name: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("With Api", () => {
    expect(
      snapshot(({ typeSafeApi }) => ({
        name: "WithApi",
        typeSafeApi,
      }))
    ).toMatchSnapshot();
  });

  it("With Website", () => {
    expect(
      snapshot(({ cloudscapeReactTsWebsite }) => ({
        name: "WithApi",
        cloudscapeReactTsWebsite,
      }))
    ).toMatchSnapshot();
  });

  it("With Api and Website", () => {
    expect(
      snapshot(({ cloudscapeReactTsWebsite, typeSafeApi }) => ({
        name: "WithApi",
        typeSafeApi,
        cloudscapeReactTsWebsite,
      }))
    ).toMatchSnapshot();
  });
});
