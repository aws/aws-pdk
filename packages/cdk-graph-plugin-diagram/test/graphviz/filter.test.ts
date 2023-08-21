/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { aws_arch } from "@aws-pdk/aws-arch";
import { CdkGraph, Filters, NodeTypeEnum } from "@aws-pdk/cdk-graph";
import { FixtureApp } from "@aws-pdk/cdk-graph/test/__fixtures__/apps";
import * as fs from "fs-extra";
import * as testUtils from "./test-utils";
import { CdkGraphDiagramPlugin, DiagramFormat } from "../../src";

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
          name: "filter-cfntype-include",
          title: "Include CfnType Diagram (filter)",
          filterPlan: {
            filters: [
              {
                graph: Filters.includeCfnType([
                  aws_arch.CfnSpec.ServiceResourceDictionary.EC2.Instance,
                  aws_arch.CfnSpec.ServiceResourceDictionary.Lambda.Function,
                  aws_arch.CfnSpec.ServiceResourceDictionary.IAM.Role,
                ]),
              },
              { store: Filters.compact() },
            ],
          },
        },
        {
          name: "filter-cfntype-exclude",
          title: "Exclude CfnType Diagram (filter)",
          filterPlan: {
            filters: [
              {
                graph: Filters.excludeCfnType([
                  /AWS::EC2::VPC.*/,
                  aws_arch.CfnSpec.ServiceResourceDictionary.IAM.Role,
                ]),
              },
              { store: Filters.compact() },
            ],
          },
        },
        {
          name: "filter-nodetype-include",
          title: "Include NodeType Diagram (filter)",
          filterPlan: {
            filters: [
              {
                store: Filters.includeNodeType([
                  NodeTypeEnum.STACK,
                  NodeTypeEnum.RESOURCE,
                ]),
              },
              { store: Filters.compact() },
            ],
          },
        },
        {
          name: "filter-nodetype-exclude",
          title: "Exclude NodeType Diagram (filter)",
          filterPlan: {
            filters: [
              {
                store: Filters.excludeNodeType([
                  NodeTypeEnum.NESTED_STACK,
                  NodeTypeEnum.CFN_RESOURCE,
                  NodeTypeEnum.OUTPUT,
                  NodeTypeEnum.PARAMETER,
                ]),
              },
              { store: Filters.compact() },
            ],
          },
        },
        {
          name: "filter-uncluster",
          title: "Uncluster Diagram (filter)",
          filterPlan: {
            filters: [
              { store: Filters.uncluster() },
              { store: Filters.compact() },
            ],
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
    // "filter-cfntype-include",
    "filter-cfntype-exclude",
    "filter-nodetype-include",
    "filter-nodetype-exclude",
    "filter-uncluster",
  ])("%s", async (diagramName) => {
    const artifact = plugin.getDiagramArtifact(diagramName, DiagramFormat.PNG);
    expect(artifact).toBeDefined();
    expect(await fs.pathExists(artifact!.filepath)).toBeTruthy();

    await testUtils.expectToMatchImageSnapshot(artifact!.filepath, diagramName);
  });
});
