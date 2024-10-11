/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CdkGraph } from "@aws/cdk-graph";
import {
  FixtureApp,
  MultiFixtureApp,
  StagedApp,
} from "@aws/cdk-graph/test/__fixtures__/apps";
import * as fs from "fs-extra";
import * as testUtils from "./test-utils";
import { CdkGraphDiagramPlugin, DiagramFormat } from "../../src";

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
      plugin = new CdkGraphDiagramPlugin({
        diagrams: [
          {
            name: "prod-stage",
            title: "Prod Stage (last)",
            // by default will render only the last stage
          },
          {
            name: "dev-stage",
            title: "Dev Stage (regex)",
            theme: {
              rendering: {
                stage: "Dev",
              },
            },
          },
          {
            name: "all-stages",
            title: "All Stages",
            theme: {
              rendering: {
                stage: "all",
              },
            },
          },
        ],
      });
      graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    describe.each(["prod-stage", "dev-stage", "all-stages"])("%s", (name) => {
      it.each([DiagramFormat.DOT, DiagramFormat.SVG, DiagramFormat.PNG])(
        "should render %s artifact",
        async (format) => {
          const artifact = plugin.getDiagramArtifact(name, format);
          expect(artifact).toBeDefined();
          expect(await fs.pathExists(artifact!.filepath)).toBeTruthy();

          switch (format) {
            case DiagramFormat.DOT: {
              expect(
                testUtils.cleanseDotSnapshot(
                  await fs.readFile(artifact!.filepath, {
                    encoding: "utf-8",
                  })
                )
              ).toMatchSnapshot();
              break;
            }
            // TODO: Figure out how to reproducabilty compare SVGs
            // case DiagramFormat.SVG: {
            //   expect(
            //     await fs.readFile(artifact!.filepath, {
            //       encoding: "utf-8",
            //     })
            //   ).toMatchSnapshot();
            //   break;
            // }
            case DiagramFormat.PNG: {
              await testUtils.expectToMatchImageSnapshot(
                artifact!.filepath,
                name
              );
            }
          }
        }
      );
    });
  });

  it("should set node position", async () => {
    const outdir = await makeCdkOutdir("node-position");

    const app = new FixtureApp({ outdir });
    const plugin = new CdkGraphDiagramPlugin({
      defaults: {
        nodePositions: {
          WebServer: { x: 0, y: 10 },
        },
      },
    });
    const graph = new CdkGraph(app, {
      plugins: [plugin],
    });
    app.synth();
    await graph.report();

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
});
