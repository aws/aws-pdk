/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as testUtils from "./test-utils";
import { CdkGraph, getConstructUUID, Graph } from "../../src";
import { MultiFixtureApp } from "../__fixtures__/apps";

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("mutations", name);

describe("cdk-graph/mutations", () => {
  describe("mutate", () => {
    let outdir: string;
    let app: MultiFixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("mutate");

      app = new MultiFixtureApp({ outdir });
      graph = new CdkGraph(app);
      app.synth();
      store = graph.graphContext!.store;
    });

    it("should not allow mutations on un-cloned store", async () => {
      expect(store.allowDestructiveMutations).toBe(false);
      expect(() => store.root.mutateCollapse()).toThrow();
    });

    it("should create mutable clone", async () => {
      const clonedStore = store.clone();

      expect(clonedStore.serialize()).toEqual(store.serialize());
      expect(clonedStore.allowDestructiveMutations).toBe(true);
    });

    describe("collapse", () => {
      let mutableStore: Graph.Store;

      beforeEach(() => {
        mutableStore = store.clone();
      });

      it("should remove all children and elevate dependencies", () => {
        const bucketNode = mutableStore.getNode(
          getConstructUUID(app.stack.dataLayer.bucket)
        ) as Graph.ResourceNode;
        const cfnBucketNode = bucketNode.cfnResource!;

        const lambdaNode1 = mutableStore.getNode(
          getConstructUUID(app.stack.apiLayer.helloHandler)
        ) as Graph.ResourceNode;
        const cfnLambdaNode1 = lambdaNode1.cfnResource!;
        expect(cfnLambdaNode1.doesReference(cfnBucketNode)).toBeTruthy();
        // expect(cfnLambdaNode1.findLink((edge) => edge.target === cfnBucketNode)?.isCrossStack).toBeFalsy();

        const lambdaNode2 = mutableStore.getNode(
          getConstructUUID(app.dependentStack.lambda)
        ) as Graph.ResourceNode;
        const cfnLambdaNode2 = lambdaNode2.cfnResource!;
        expect(cfnLambdaNode2.doesReference(cfnBucketNode)).toBeTruthy();

        const roleNode2 = mutableStore.getNode(
          getConstructUUID(app.dependentStack.role)
        ) as Graph.ResourceNode;
        const cfnRoleNode2 = roleNode2.cfnResource!;
        expect(cfnRoleNode2.doesReference(cfnBucketNode)).toBeTruthy();
        expect(cfnRoleNode2.doesReference(cfnLambdaNode1)).toBeTruthy();
        expect(cfnRoleNode2.doesReference(cfnLambdaNode2)).toBeTruthy();

        expect(bucketNode.isLeaf).toBe(false);
        bucketNode.mutateCollapse();
        expect(bucketNode.isLeaf).toBe(true);

        expect(() => mutableStore.getNode(cfnBucketNode.uuid)).toThrow(
          `Node ${cfnBucketNode.uuid} is not defined`
        );
        // should no longer reference cfnBucket
        expect(cfnLambdaNode1.doesReference(cfnBucketNode)).toBeFalsy();
        expect(cfnLambdaNode2.doesReference(cfnBucketNode)).toBeFalsy();
        expect(cfnRoleNode2.doesReference(cfnBucketNode)).toBeFalsy();
        // should now reference Bucket
        expect(cfnLambdaNode1.doesReference(bucketNode)).toBeTruthy();
        expect(cfnLambdaNode2.doesReference(bucketNode)).toBeTruthy();
        expect(cfnRoleNode2.doesReference(bucketNode)).toBeTruthy();

        expect(
          cfnLambdaNode1.findLink((edge) => edge.target === bucketNode)
            ?.isCrossStack
        ).toBeFalsy();
        // should not have direct link
        expect(
          cfnLambdaNode2.findLink(
            (edge) => edge.target === bucketNode,
            false,
            false
          )?.isCrossStack
        ).toBeFalsy();
        // should have indirect link
        expect(
          cfnLambdaNode2.findLink((edge) => edge.target === bucketNode)
            ?.isCrossStack
        ).toBeTruthy();
        expect(
          cfnRoleNode2.findLink((edge) => edge.target === bucketNode)
            ?.isCrossStack
        ).toBeTruthy();
      });
    });
  });
});
