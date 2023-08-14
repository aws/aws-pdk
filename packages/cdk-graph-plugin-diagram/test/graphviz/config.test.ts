/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CdkGraph, FilterPreset, getConstructUUID } from "@aws-pdk/cdk-graph";
import { FixtureApp } from "@aws-pdk/cdk-graph/test/__fixtures__/apps";
import * as fs from "fs-extra";
import * as testUtils from "./test-utils";
import { CdkGraphDiagramPlugin, DiagramFormat } from "../../src";

jest.setTimeout(90000); // CI tests timeout occasionally so increase to large timeout buffer

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("config", name);

describe("config", () => {
  describe("default", () => {
    let outdir: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let plugin: CdkGraphDiagramPlugin;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("default");

      app = new FixtureApp({ outdir });
      plugin = new CdkGraphDiagramPlugin();
      graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    it("should generate default diagram", async () => {
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

      await testUtils.expectToMatchImageSnapshot(
        plugin.defaultPngArtifact!.filepath,
        "default"
      );
    });
  });
  describe("plan", () => {
    let outdir: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let plugin: CdkGraphDiagramPlugin;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("default");

      app = new FixtureApp({ outdir });
      plugin = new CdkGraphDiagramPlugin({
        diagrams: [
          {
            name: "compact",
            title: "Compact Diagram",
            filterPlan: {
              preset: FilterPreset.COMPACT,
            },
          },
          {
            name: "verbose",
            title: "Verbose Diagram",
            format: DiagramFormat.PNG,
            ignoreDefaults: true,
          },
          {
            name: "focus",
            title: "Focus Data Diagram (non-extraneous)",
            filterPlan: {
              focus: (store) =>
                store.getNode(getConstructUUID(app.stack.dataLayer)),
              preset: FilterPreset.NON_EXTRANEOUS,
            },
            ignoreDefaults: true,
          },
          {
            name: "focus-nohoist",
            title: "Focus Website Diagram (noHoist, verbose)",
            filterPlan: {
              focus: {
                node: (store) =>
                  store.getNode(getConstructUUID(app.stack.website)),
                noHoist: true,
              },
            },
            ignoreDefaults: true,
          },
        ],
      });
      graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    it("should not generate default diagram", async () => {
      expect(plugin.defaultDotArtifact).not.toBeDefined();
    });

    it.each(["compact", "verbose", "focus", "focus-nohoist"])(
      "%s",
      async (diagramName) => {
        const artifact = plugin.getDiagramArtifact(
          diagramName,
          DiagramFormat.PNG
        );
        expect(artifact).toBeDefined();
        expect(await fs.pathExists(artifact!.filepath)).toBeTruthy();

        await testUtils.expectToMatchImageSnapshot(
          artifact!.filepath,
          diagramName,
          // focus and focus-nohoist rendering of fonts is a bit more variant on CI
          diagramName.startsWith("focus") ? 0.1 : undefined,
          diagramName.startsWith("focus") ? 0.2 : undefined
        );
      }
    );
  });
});
