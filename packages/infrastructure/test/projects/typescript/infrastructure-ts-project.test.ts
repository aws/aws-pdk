/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Language } from "@aws/type-safe-api";
import { synthSnapshot } from "projen/lib/util/synth";
import {
  InfrastructureTsProject,
  InfrastructureTsProjectOptions,
} from "../../../src";
import {
  BuildOptionsProps,
  snapshotInfrastructureProject,
} from "../utils/snapshot-infra-project";

describe("InfrastructureTsProject", () => {
  const snapshot = (
    buildOptions: (props: BuildOptionsProps) => InfrastructureTsProjectOptions
  ) =>
    snapshotInfrastructureProject(
      Language.TYPESCRIPT,
      InfrastructureTsProject,
      buildOptions
    );

  it("Defaults", () => {
    const project = new InfrastructureTsProject({
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
