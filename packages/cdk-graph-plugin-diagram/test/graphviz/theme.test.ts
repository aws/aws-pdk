/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { aws_arch } from "@aws/aws-arch";
import { CdkGraph } from "@aws/cdk-graph";
import { FixtureApp } from "@aws/cdk-graph/test/__fixtures__/apps";
import * as fs from "fs-extra";
import { capitalize } from "lodash";
import * as testUtils from "./test-utils";
import { CdkGraphDiagramPlugin, DiagramFormat } from "../../src";
import { GraphThemeRenderingIconTarget } from "../../src/internal/graphviz";

jest.setTimeout(90000); // CI tests timeout occasionally so increase to large timeout buffer

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("theme", name);

describe("theme", () => {
  describe.each(["light", "dark"] as aws_arch.Themes[])("%s", (theme) => {
    let outdir: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let plugin: CdkGraphDiagramPlugin;

    beforeAll(async () => {
      outdir = await makeCdkOutdir(theme);

      app = new FixtureApp({ outdir });
      plugin = new CdkGraphDiagramPlugin({
        diagrams: [
          {
            name: theme,
            title: `${capitalize(theme)} Theme Diagram`,
            theme: theme,
          },
          {
            name: `${theme}-services`,
            title: `${capitalize(theme)} Theme Custom Diagram`,
            theme: {
              theme: theme,
              rendering: {
                resourceIconMin: GraphThemeRenderingIconTarget.SERVICE,
                resourceIconMax: GraphThemeRenderingIconTarget.CATEGORY,
                cfnResourceIconMin: GraphThemeRenderingIconTarget.DATA,
                cfnResourceIconMax: GraphThemeRenderingIconTarget.RESOURCE,
              },
            },
          },
          {
            name: `${theme}-verbose`,
            title: `${capitalize(theme)} Theme Verbose Diagram`,
            ignoreDefaults: true,
            theme: theme,
          },
        ],
      });
      graph = new CdkGraph(app, {
        plugins: [plugin],
      });
      app.synth();
      await graph.report();
    });

    it.each([theme, `${theme}-services`, `${theme}-verbose`])(
      "%s",
      async (id) => {
        const artifact = plugin.getDiagramArtifact(id, DiagramFormat.PNG);
        const filepath = artifact!.filepath;
        expect(await fs.pathExists(filepath)).toBeTruthy();

        await testUtils.expectToMatchImageSnapshot(filepath, id);
      }
    );
  });
});
