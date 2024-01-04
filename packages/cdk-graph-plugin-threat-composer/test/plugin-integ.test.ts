/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import { CdkGraph } from "@aws/cdk-graph";
import { PDKPipelineIntegApp } from "@aws/cdk-graph/test/__fixtures__/pdk-integ";
import * as testUtils from "./test-utils";
import { CdkGraphThreatComposerPlugin } from "../src";

jest.setTimeout(90000);

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("plugin-integ", name);

describe("plugin-integ", () => {
  describe("pipeline", () => {
    let plugin: CdkGraphThreatComposerPlugin;

    beforeAll(async () => {
      const outdir = await makeCdkOutdir("pipeline");

      const app = new PDKPipelineIntegApp({ outdir });
      plugin = new CdkGraphThreatComposerPlugin();
      const graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    it("should generate a threat model", () => {
      expect(plugin.threatModelArtifact).toBeDefined();
      expect(fs.existsSync(plugin.threatModelArtifact!.filepath)).toBeTruthy();
      expect(
        fs.readFileSync(plugin.threatModelArtifact!.filepath, "utf-8")
      ).toMatchSnapshot();
    });
  });
});
