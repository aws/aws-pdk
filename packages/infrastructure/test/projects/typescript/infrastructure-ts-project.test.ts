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

  it("With Multiple Apis and Website", () => {
    expect(
      snapshot(({ cloudscapeReactTsWebsites, typeSafeApis }) => ({
        name: "WithMultipleApiAndWebsites",
        typeSafeApis,
        cloudscapeReactTsWebsites,
      }))
    ).toMatchSnapshot();
  });

  it("With Multiple Apis and Single Website", () => {
    expect(
      snapshot(({ cloudscapeReactTsWebsite, typeSafeApis }) => ({
        name: "WithMultipleApiAndSingleWebsite",
        typeSafeApis,
        cloudscapeReactTsWebsite,
      }))
    ).toMatchSnapshot();
  });

  it("With Multiple Websites and Single API", () => {
    expect(
      snapshot(({ cloudscapeReactTsWebsites, typeSafeApi }) => ({
        name: "WithMultipleWebsiteSingleApi",
        typeSafeApi,
        cloudscapeReactTsWebsites,
      }))
    ).toMatchSnapshot();
  });

  it("Skips license generation when told to", () => {
    const tsWithLic = new InfrastructureTsProject({
      name: "withlic",
    });
    const dirSnapshotWithLic = synthSnapshot(tsWithLic);
    expect(dirSnapshotWithLic.LICENSE).toBeDefined();
    const tsNoLic = new InfrastructureTsProject({
      name: "nolic",
      licensed: false,
    });
    const dirSnapshotNoLIc = synthSnapshot(tsNoLic);
    expect(dirSnapshotNoLIc.LICENSE).not.toBeDefined();
  });
});
