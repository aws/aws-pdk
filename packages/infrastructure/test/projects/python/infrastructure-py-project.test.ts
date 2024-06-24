/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Language } from "@aws/type-safe-api";
import { synthSnapshot } from "projen/lib/util/synth";
import {
  InfrastructurePyProject,
  InfrastructurePyProjectOptions,
} from "../../../src";
import {
  BuildOptionsProps,
  snapshotInfrastructureProject,
} from "../utils/snapshot-infra-project";

describe("InfrastructurePyProject", () => {
  const snapshot = (
    buildOptions: (props: BuildOptionsProps) => InfrastructurePyProjectOptions
  ) =>
    snapshotInfrastructureProject(
      Language.PYTHON,
      InfrastructurePyProject,
      buildOptions
    );

  it("Defaults", () => {
    const project = new InfrastructurePyProject({
      name: "Defaults",
    });
    expect(synthSnapshot(project)).toMatchSnapshot();
  });

  it("With Stages", () => {
    const project = new InfrastructurePyProject({
      name: "WithStages",
      stages: [
        {
          stageName: "Beta",
          account: 1,
          region: "us-west-2",
        },
        {
          stageName: "Gamma",
          account: 2,
          region: "us-west-2",
        },
        {
          stageName: "Prod",
          account: 3,
          region: "us-west-2",
        },
      ],
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
});
