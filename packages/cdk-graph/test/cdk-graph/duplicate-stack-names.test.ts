/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { App, Stack, Stage } from "aws-cdk-lib";
import * as testUtils from "./test-utils";
import { CdkGraph, Graph } from "../../src";

describe("cdk-graph/compute/duplicate-stack-names", () => {
  it("keeps stacks that share a stackName across stages as distinct nodes", async () => {
    const outdir = await testUtils.makeCdkOutDir(
      "compute",
      "duplicate-stack-names"
    );

    const app = new App({ outdir });

    // Two stages, each holding a stack under the SAME explicit stackName. A CloudFormation stack
    // name only has to be unique per account and region, so reusing one name across environments
    // is a legal and common pattern. The graph must keep the two as distinct nodes rather than
    // collapsing them onto one UUID, which previously threw "Stack.stack is not self".
    const stageA = new Stage(app, "StageA");
    new Stack(stageA, "Network", { stackName: "shared-network" });
    const stageB = new Stage(app, "StageB");
    new Stack(stageB, "Network", { stackName: "shared-network" });

    const graph = new CdkGraph(app);
    app.synth();

    const stacks = graph.graphContext!.store.stacks;
    expect(stacks).toHaveLength(2);
    expect(stacks[0].uuid).not.toEqual(stacks[1].uuid);

    // Both are reachable by their own construct's UUID, so nothing collapsed.
    expect(
      stacks.every((stack) => graph.graphContext!.store.getNode(stack.uuid))
    ).toBe(true);
  });
});
