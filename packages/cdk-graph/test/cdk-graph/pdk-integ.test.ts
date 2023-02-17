/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs-extra";
import * as testUtils from "./test-utils";
import { CdkGraph, Graph } from "../../src";
import { PDKPipelineIntegApp } from "../__fixtures__/pdk-integ";

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("pdk-integ", name);

describe("cdk-graph/pdk-integ", () => {
  describe("pipeline", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: PDKPipelineIntegApp;
    let graph: CdkGraph;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("pipeline");

      app = new PDKPipelineIntegApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      graphJsonFile = graph.graphContext!.graphJson.filepath;
      await graph.report();
    });

    it("should synthesize graph.json", async () => {
      expect(await fs.pathExists(graphJsonFile)).toBe(true);
    });

    it("should serialize <-> deserialize to same", async () => {
      const serializedStore = await fs.readJSON(graphJsonFile, {
        encoding: "utf-8",
      });
      const deserializedStore =
        Graph.Store.fromSerializedStore(serializedStore);
      const reserializedStore = deserializedStore.serialize();
      expect(serializedStore).toEqual(reserializedStore);
    });
  });
});
