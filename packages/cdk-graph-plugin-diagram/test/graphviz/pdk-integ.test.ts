/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CdkGraph } from "@aws/cdk-graph";
import { PDKPipelineIntegApp } from "@aws/cdk-graph/test/__fixtures__/pdk-integ";
import * as fs from "fs-extra";
import * as testUtils from "./test-utils";
import { CdkGraphDiagramPlugin } from "../../src";

jest.setTimeout(90000); // CI tests timeout occasionally so increase to large timeout buffer

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("pdk-integ", name);

describe("pdk-integ", () => {
  describe("pipeline", () => {
    let outdir: string;
    let app: PDKPipelineIntegApp;
    let graph: CdkGraph;
    let plugin: CdkGraphDiagramPlugin;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("pipeline");

      app = new PDKPipelineIntegApp({ outdir });
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
        "pdk-integ-pipeline"
      );
    });
  });
});
