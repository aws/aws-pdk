/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
import * as path from "path";
import * as fs from "fs-extra";
import { CdkGraph, getConstructUUID, Graph, NodeTypeEnum } from "../../src";
import { FixtureApp, MultiFixtureApp, StagedApp } from "../__fixtures__/apps";

async function getCdkOutDir(name: string): Promise<string> {
  const dir = path.join(__dirname, "..", ".tmp", "compute", name, "cdk.out");

  await fs.ensureDir(dir);
  await fs.emptyDir(dir);

  return dir;
}

describe("cdk-graph/compute", () => {
  describe("single-stack-app", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: FixtureApp;
    let graph: CdkGraph;

    beforeAll(async () => {
      outdir = await getCdkOutDir("single-stack-app");

      app = new FixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      graphJsonFile = graph.graphContext!.graphJson.filepath;
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

    it("should graph references and dependencies", () => {
      const bucketNode = graph.graphContext?.store.getNode(
        getConstructUUID(app.stack.bucket)
      ) as Graph.ResourceNode;
      expect(bucketNode).toBeInstanceOf(Graph.ResourceNode);
      const cfnBucketNode = bucketNode.cfnResource!;
      expect(cfnBucketNode).toBeInstanceOf(Graph.CfnResourceNode);

      const lambdaNode = graph.graphContext?.store.getNode(
        getConstructUUID(app.stack.lambda)
      ) as Graph.ResourceNode;
      expect(lambdaNode).toBeInstanceOf(Graph.ResourceNode);
      const cfnLambdaNode = lambdaNode.cfnResource!;
      expect(cfnLambdaNode).toBeInstanceOf(Graph.CfnResourceNode);

      const roleNode = graph.graphContext?.store.getNode(
        getConstructUUID(app.stack.role)
      ) as Graph.ResourceNode;
      expect(roleNode).toBeInstanceOf(Graph.ResourceNode);
      const cfnRoleNode = roleNode.cfnResource!;
      expect(cfnRoleNode).toBeInstanceOf(Graph.CfnResourceNode);

      expect(cfnLambdaNode.doesReference(cfnBucketNode)).toBeTruthy();
    });
  });

  describe("multi-stack-app", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: MultiFixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;

    beforeAll(async () => {
      outdir = await getCdkOutDir("multi-stack-app");

      app = new MultiFixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store;
      graphJsonFile = graph.graphContext!.graphJson.filepath;
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

    it("should graph references and dependencies", () => {
      const bucketNode = store.getNode(
        getConstructUUID(app.stack.bucket)
      ) as Graph.ResourceNode;
      expect(bucketNode).toBeInstanceOf(Graph.ResourceNode);
      const cfnBucketNode = bucketNode.cfnResource!;
      expect(cfnBucketNode).toBeInstanceOf(Graph.CfnResourceNode);

      const lambdaNode1 = store.getNode(
        getConstructUUID(app.stack.lambda)
      ) as Graph.ResourceNode;
      expect(lambdaNode1).toBeInstanceOf(Graph.ResourceNode);
      const cfnLambdaNode1 = lambdaNode1.cfnResource!;
      expect(cfnLambdaNode1).toBeInstanceOf(Graph.CfnResourceNode);
      expect(cfnLambdaNode1.doesReference(cfnBucketNode)).toBeTruthy();

      const lambdaNode2 = store.getNode(
        getConstructUUID(app.dependentStack.lambda)
      ) as Graph.ResourceNode;
      expect(lambdaNode2).toBeInstanceOf(Graph.ResourceNode);
      const cfnLambdaNode2 = lambdaNode2.cfnResource!;
      expect(cfnLambdaNode2).toBeInstanceOf(Graph.CfnResourceNode);
      expect(cfnLambdaNode2.doesReference(cfnBucketNode)).toBeTruthy();

      const roleNode2 = store.getNode(
        getConstructUUID(app.dependentStack.role)
      ) as Graph.ResourceNode;
      expect(roleNode2).toBeInstanceOf(Graph.ResourceNode);
      const cfnRoleNode2 = roleNode2.cfnResource!;
      expect(cfnRoleNode2).toBeInstanceOf(Graph.CfnResourceNode);
      expect(cfnRoleNode2.doesReference(cfnBucketNode));
      expect(cfnRoleNode2.doesReference(cfnLambdaNode1));
      expect(cfnRoleNode2.doesReference(cfnLambdaNode2));
    });
  });

  describe("staged-app", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: StagedApp;
    let graph: CdkGraph;
    let store: Graph.Store;

    beforeAll(async () => {
      outdir = await getCdkOutDir("staged-app");

      app = new StagedApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store;
      graphJsonFile = graph.graphContext!.graphJson.filepath;
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

    it("should have 3 stages with matching stacks", () => {
      const stages = store.stages;
      expect(stages).toHaveLength(3);

      const [stage1, stage2, stage3] = stages;
      const stage1Nodes = stage1.findAll();
      const stage2Nodes = stage2.findAll();
      const stage3Nodes = stage3.findAll();
      const len = stage1Nodes.length;

      function compareNode(a: Graph.Node, b: Graph.Node) {
        expect(a.nodeType).toEqual(b.nodeType);
        if (a.nodeType !== NodeTypeEnum.OUTPUT) {
          expect(a.id).toEqual(b.id);
          expect(a.path.replace(/^\w+\//, "")).toEqual(
            b.path.replace(/^\w+\//, "")
          );
        }
      }

      // skip first which is the stage
      for (let i = 1; i < len; i++) {
        compareNode(stage1Nodes[i], stage2Nodes[i]);
        compareNode(stage1Nodes[i], stage3Nodes[i]);
      }
    });
  });
});
