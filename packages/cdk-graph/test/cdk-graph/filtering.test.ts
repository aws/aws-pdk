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
import { CfnRole } from "aws-cdk-lib/aws-iam";
import { CfnFunction } from "aws-cdk-lib/aws-lambda";
import * as fs from "fs-extra";
import {
  CdkGraph,
  FilterPreset,
  getConstructUUID,
  Graph,
  performGraphFilterPlan,
} from "../../src";
import { FixtureApp } from "../__fixtures__/apps";

async function getCdkOutDir(name: string): Promise<string> {
  const dir = path.join(__dirname, "..", ".tmp", "filtering", name, "cdk.out");

  await fs.ensureDir(dir);
  await fs.emptyDir(dir);

  return dir;
}

describe("cdk-graph/filtering", () => {
  describe("preset/compact", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;

    beforeAll(async () => {
      outdir = await getCdkOutDir("preset/compact");

      app = new FixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store.clone();
      graphJsonFile = graph.graphContext!.graphJson.filepath;
    });

    it("should have compactable nodes before testing", () => {
      // sanity check to ensure we are testing the preset
      // extraneous
      expect(
        store.root.findAll({ predicate: (node) => node.isExtraneous }).length
      ).toBeGreaterThan(0);
      expect(
        store.root.findAllLinks({ predicate: (edge) => edge.isExtraneous })
          .length
      ).toBeGreaterThan(0);
      // cfn resources
      expect(
        store.root.findAll({
          predicate: (node) => Graph.CfnResourceNode.isCfnResourceNode(node),
        }).length
      ).toBeGreaterThan(0);
    });

    it("should perform compact filter without errors", () => {
      expect(() =>
        performGraphFilterPlan(store, {
          preset: FilterPreset.COMPACT,
        })
      ).not.toThrow();
    });

    it("should prune all extraneous node", () => {
      expect(
        store.root.findAll({ predicate: (node) => node.isExtraneous }).length
      ).toBe(0);
    });

    it("should prune all extraneous edges", () => {
      expect(
        store.root.findAllLinks({ predicate: (edge) => edge.isExtraneous })
          .length
      ).toBe(0);
    });

    it("should collapse all CfnResourceNodes to parent", () => {
      expect(
        store.root.findAll({
          predicate: (node) => Graph.CfnResourceNode.isCfnResourceNode(node),
        }).length
      ).toBe(0);
    });
  });

  describe("preset/reroot/hoist", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;
    let planRoot: Graph.Node;

    beforeAll(async () => {
      outdir = await getCdkOutDir("preset/reroot/hoist");

      app = new FixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store.clone();
      graphJsonFile = graph.graphContext!.graphJson.filepath;
      planRoot = store.getNode(getConstructUUID(app.stack.lambda));
    });

    it("should perform reroot hoist without error", () => {
      expect(() =>
        performGraphFilterPlan(store, {
          root: planRoot,
          hoistRoot: true,
        })
      ).not.toThrow();
    });

    it("should hoist plan root to store root and remove other children of root", () => {
      expect(store.root.children.length).toBe(1);
      expect(store.root.children[0].uuid).toBe(planRoot.uuid);
    });

    it("should only have plan root nodes in the store", () => {
      expect(store.counts.nodes).toBe(planRoot.findAll().length + 1); // plus 1 for store.root
    });

    it("should only have plan root edges in the store", () => {
      expect(store.counts.edges).toBe(planRoot.findAllLinks().length);
    });
  });

  describe("preset/reroot/no-hoist", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;
    let planRoot: Graph.Node;

    beforeAll(async () => {
      outdir = await getCdkOutDir("preset/reroot/no-hoist");

      app = new FixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store.clone();
      graphJsonFile = graph.graphContext!.graphJson.filepath;
      planRoot = store.getNode(getConstructUUID(app.stack.lambda));
    });

    it("should perform reroot hoist without error", () => {
      expect(() =>
        performGraphFilterPlan(store, {
          root: planRoot,
          hoistRoot: false,
        })
      ).not.toThrow();
    });

    it("should remove all non-ancestral nodes from store", () => {
      expect(
        store.root.findAll({
          predicate: (node) => {
            if (node === planRoot) return false;
            if (planRoot.isAncestor(node)) return false;
            if (node.isAncestor(planRoot)) return false;
            return true;
          },
        }).length
      ).toBe(0);
    });

    it("should only have plan root nodes and direct ancestors in the store", () => {
      expect(store.counts.nodes).toBe(
        planRoot.findAll().length + planRoot.scopes.length
      );
    });
  });

  describe("filter/include", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;

    const filterTypes = [
      CfnFunction.CFN_RESOURCE_TYPE_NAME,
      CfnRole.CFN_RESOURCE_TYPE_NAME,
    ];

    beforeAll(async () => {
      outdir = await getCdkOutDir("filter");

      app = new FixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store.clone();
      graphJsonFile = graph.graphContext!.graphJson.filepath;
    });

    it("should perform filter without error", () => {
      expect(() =>
        performGraphFilterPlan(store, {
          filters: [
            {
              node: (node) =>
                !!node.cfnType && filterTypes.includes(node.cfnType),
              edge: (edge) => Graph.Reference.isReference(edge),
            },
          ],
        })
      ).not.toThrow();
    });

    it("should only have filter types nodes", () => {
      expect(
        store.root.findAll({
          predicate: (node) =>
            !!node.cfnType && !filterTypes.includes(node.cfnType),
        }).length
      ).toBe(0);

      expect(store.counts.cfnResources).toMatchSnapshot();
    });

    it("should only have filter type edge", () => {
      expect(
        store.root.findAllLinks({
          predicate: (edge) => !Graph.Reference.isReference(edge),
        }).length
      ).toBe(0);
      expect(store.counts.edgeTypes).toMatchSnapshot();
    });
  });

  describe("filter/exclude", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: FixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;

    const filterTypes = [
      CfnFunction.CFN_RESOURCE_TYPE_NAME,
      CfnRole.CFN_RESOURCE_TYPE_NAME,
    ];

    beforeAll(async () => {
      outdir = await getCdkOutDir("filter");

      app = new FixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store.clone();
      graphJsonFile = graph.graphContext!.graphJson.filepath;
    });

    it("should perform filter without error", () => {
      expect(() =>
        performGraphFilterPlan(store, {
          filters: [
            {
              node: (node) =>
                !!node.cfnType && filterTypes.includes(node.cfnType),
              edge: (edge) => Graph.Reference.isReference(edge),
              inverse: true,
            },
          ],
        })
      ).not.toThrow();
    });

    it("should not have excluded filter resource types", () => {
      expect(
        store.root.findAll({
          predicate: (node) =>
            !!node.cfnType && filterTypes.includes(node.cfnType),
        }).length
      ).toBe(0);

      expect(store.counts.cfnResources).toMatchSnapshot();
    });

    it("should not have excluded filter edge types", () => {
      expect(
        store.root.findAllLinks({
          predicate: (edge) => Graph.Reference.isReference(edge),
        }).length
      ).toBe(0);
      expect(store.counts.edgeTypes).toMatchSnapshot();
    });
  });
});
