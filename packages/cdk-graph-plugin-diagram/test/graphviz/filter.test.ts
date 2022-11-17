/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { aws_arch } from "@aws-prototyping-sdk/aws-arch";
import {
  CdkGraph,
  Filters,
  NodeTypeEnum,
} from "@aws-prototyping-sdk/cdk-graph";
import { FixtureApp } from "@aws-prototyping-sdk/cdk-graph/test/__fixtures__/apps";
import * as fs from "fs-extra";
import sharp = require("sharp"); // eslint-disable-line @typescript-eslint/no-require-imports
import { CdkGraphDiagramPlugin, DiagramFormat } from "../../src";
import * as testUtils from "./test-utils";

jest.setTimeout(90000); // CI tests timeout occasionally so increase to large timeout buffer

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("filter", name);

describe("filter", () => {
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
          name: "includeCfnType",
          title: "Include CfnType Diagram (filter)",
          filterPlan: {
            filters: [
              Filters.includeCfnType([
                aws_arch.CfnSpec.ServiceResourceDictionary.EC2.Instance,
                aws_arch.CfnSpec.ServiceResourceDictionary.Lambda.Function,
                aws_arch.CfnSpec.ServiceResourceDictionary.IAM.Role,
              ]),
              Filters.compact(),
            ],
          },
        },
        {
          name: "excludeCfnType",
          title: "Exclude CfnType Diagram (filter)",
          filterPlan: {
            filters: [
              Filters.excludeCfnType([
                /AWS::EC2::VPC.*/,
                aws_arch.CfnSpec.ServiceResourceDictionary.IAM.Role,
              ]),
              Filters.compact(),
            ],
          },
        },
        {
          name: "includeNodeType",
          title: "Include NodeType Diagram (filter)",
          filterPlan: {
            filters: [
              Filters.includeNodeType([
                NodeTypeEnum.STACK,
                NodeTypeEnum.RESOURCE,
              ]),
              Filters.compact(),
            ],
          },
        },
        {
          name: "excludeNodeType",
          title: "Exclude NodeType Diagram (filter)",
          filterPlan: {
            filters: [
              Filters.excludeNodeType([
                NodeTypeEnum.NESTED_STACK,
                NodeTypeEnum.CFN_RESOURCE,
                NodeTypeEnum.OUTPUT,
                NodeTypeEnum.PARAMETER,
              ]),
              Filters.compact(),
            ],
          },
        },
        {
          name: "uncluster",
          title: "Uncluster Diagram (filter)",
          filterPlan: {
            filters: [Filters.uncluster(), Filters.compact()],
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

  it("should not generate default diagram", async () => {
    expect(plugin.defaultDotArtifact).not.toBeDefined();
  });

  it.each([
    "includeCfnType",
    "excludeCfnType",
    "includeNodeType",
    "excludeNodeType",
    "uncluster",
  ])("%s", async (diagramName) => {
    const artifact = plugin.getDiagramArtifact(diagramName, DiagramFormat.PNG);
    expect(artifact).toBeDefined();
    expect(await fs.pathExists(artifact!.filepath)).toBeTruthy();

    expect(await sharp(artifact!.filepath).toBuffer()).toMatchImageSnapshot();
  });
});
