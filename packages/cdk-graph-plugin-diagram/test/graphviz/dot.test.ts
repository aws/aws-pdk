/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CdkGraph } from "@aws-prototyping-sdk/cdk-graph";
import {
  FixtureApp,
  MultiFixtureApp,
  StagedApp,
} from "@aws-prototyping-sdk/cdk-graph/test/__fixtures__/apps";
import * as fs from "fs-extra";
import { CdkGraphDiagramPlugin } from "../../src";
import * as testUtils from "./test-utils";

jest.setTimeout(90000); // CI tests timeout occasionally so increase to large timeout buffer

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("dot", name);

describe("dot", () => {
  describe("single-stack-app", () => {
    let outdir: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let plugin: CdkGraphDiagramPlugin;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("single-stack-app");

      app = new FixtureApp({ outdir });
      plugin = new CdkGraphDiagramPlugin();
      graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    it("should generate dot artifact", async () => {
      expect(plugin.defaultDotArtifact).toBeDefined();
      expect(
        await fs.pathExists(plugin.defaultDotArtifact!.filepath)
      ).toBeTruthy();
      expect(
        testUtils.cleanseDotSnapshot(
          await fs.readFile(plugin.defaultDotArtifact!.filepath, {
            encoding: "utf-8",
          })
        )
      ).toMatchSnapshot();
    });

    it("should generate png artifact", async () => {
      expect(plugin.defaultPngArtifact).toBeDefined();
      expect(
        await fs.pathExists(plugin.defaultPngArtifact!.filepath)
      ).toBeTruthy();

      await testUtils.expectToMatchImageSnapshot(
        plugin.defaultPngArtifact!.filepath,
        "single-stack"
      );
    });
  });

  describe("multi-stack-app", () => {
    let outdir: string;
    let app: MultiFixtureApp;
    let graph: CdkGraph;
    let plugin: CdkGraphDiagramPlugin;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("multi-stack-app");

      app = new MultiFixtureApp({ outdir });
      plugin = new CdkGraphDiagramPlugin();
      graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    it("should generate dot artifact", async () => {
      expect(plugin.defaultDotArtifact).toBeDefined();
      expect(
        await fs.pathExists(plugin.defaultDotArtifact!.filepath)
      ).toBeTruthy();
      expect(
        testUtils.cleanseDotSnapshot(
          await fs.readFile(plugin.defaultDotArtifact!.filepath, {
            encoding: "utf-8",
          })
        )
      ).toMatchSnapshot();
    });

    it("should generate png artifact", async () => {
      expect(plugin.defaultPngArtifact).toBeDefined();
      expect(
        await fs.pathExists(plugin.defaultPngArtifact!.filepath)
      ).toBeTruthy();

      await testUtils.expectToMatchImageSnapshot(
        plugin.defaultPngArtifact!.filepath,
        "multi-stack"
      );
    });
  });

  describe("staged-app", () => {
    let outdir: string;
    let app: StagedApp;
    let graph: CdkGraph;
    let plugin: CdkGraphDiagramPlugin;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("staged-app");

      app = new StagedApp({ outdir });
      plugin = new CdkGraphDiagramPlugin();
      graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    it("should generate dot artifact", async () => {
      expect(plugin.defaultDotArtifact).toBeDefined();
      expect(
        await fs.pathExists(plugin.defaultDotArtifact!.filepath)
      ).toBeTruthy();
      expect(
        testUtils.cleanseDotSnapshot(
          await fs.readFile(plugin.defaultDotArtifact!.filepath, {
            encoding: "utf-8",
          })
        )
      ).toMatchSnapshot();
    });

    it("should generate png artifact", async () => {
      expect(plugin.defaultPngArtifact).toBeDefined();
      expect(
        await fs.pathExists(plugin.defaultPngArtifact!.filepath)
      ).toBeTruthy();

      await testUtils.expectToMatchImageSnapshot(
        plugin.defaultPngArtifact!.filepath,
        "staged"
      );
    });
  });
});
