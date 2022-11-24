/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CfnRole } from "aws-cdk-lib/aws-iam";
import { CfnFunction } from "aws-cdk-lib/aws-lambda";
import {
  CdkGraph,
  FilterPreset,
  getConstructUUID,
  Graph,
  NodeTypeEnum,
  performGraphFilterPlan,
} from "../../src";
import { Filters } from "../../src/filtering/filters";
import { MultiFixtureApp } from "../__fixtures__/apps";
import * as testUtils from "./test-utils";

const makeCdkOutdir = async (name: string) =>
  testUtils.makeCdkOutDir("filtering", name);

describe("cdk-graph/filtering", () => {
  let outdir: string;
  let app: MultiFixtureApp;
  let graph: CdkGraph;
  let originStore: Graph.Store;

  beforeAll(async () => {
    outdir = await makeCdkOutdir("filter");

    app = new MultiFixtureApp({ outdir });
    graph = new CdkGraph(app);
    app.synth();
    originStore = graph.graphContext!.store;
  });

  describe("preset", () => {
    describe("compact", () => {
      let store: Graph.Store;
      beforeAll(() => {
        store = originStore.clone();
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

    describe("focus/hoist", () => {
      let store: Graph.Store;
      let focusedNode: Graph.Node;

      beforeAll(() => {
        store = originStore.clone();
        focusedNode = store.getNode(getConstructUUID(app.stack.lambda));
      });

      it("should perform focus hoist without error", () => {
        expect(() =>
          performGraphFilterPlan(store, {
            focus: focusedNode,
          })
        ).not.toThrow();
      });

      it("should hoist plan root to store root and remove other children of root", () => {
        expect(store.root.children.length).toBe(1);
        expect(store.root.children[0].uuid).toBe(focusedNode.uuid);
      });

      it("should only have plan root nodes in the store", () => {
        expect(store.counts.nodes).toBe(focusedNode.findAll().length);
      });

      it("should only have plan root edges in the store", () => {
        expect(store.counts.edges).toBe(focusedNode.findAllLinks().length);
      });
    });

    describe("focus/no-hoist", () => {
      let store: Graph.Store;
      let focusedNode: Graph.Node;

      beforeAll(() => {
        store = originStore.clone();
        focusedNode = store.getNode(getConstructUUID(app.stack.lambda));
      });
      it("should perform focus hoist without error", () => {
        expect(() =>
          performGraphFilterPlan(store, {
            focus: {
              node: focusedNode,
              noHoist: true,
            },
          })
        ).not.toThrow();
      });

      it("should remove all non-ancestral nodes from store", () => {
        expect(
          store.root.findAll({
            predicate: (node) => {
              if (node === focusedNode) return false;
              if (focusedNode.isAncestor(node)) return false;
              if (node.isAncestor(focusedNode)) return false;
              return true;
            },
          }).length
        ).toBe(0);
      });

      it("should only have plan root nodes and direct ancestors in the store", () => {
        // NB: plus 1 for root
        expect(store.counts.nodes + 1).toBe(
          focusedNode.findAll().length + focusedNode.scopes.length
        );
      });
    });
  });

  describe("filter", () => {
    describe("custom", () => {
      let store: Graph.Store;

      beforeAll(() => {
        store = originStore.clone();
      });

      const filterTypes = [
        CfnFunction.CFN_RESOURCE_TYPE_NAME,
        CfnRole.CFN_RESOURCE_TYPE_NAME,
      ];

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

    describe("nodeType", () => {
      describe("include", () => {
        let store: Graph.Store;

        beforeAll(() => {
          store = originStore.clone();
        });

        const include = [NodeTypeEnum.CFN_RESOURCE, NodeTypeEnum.STACK];

        it("should perform filter without error", () => {
          expect(() =>
            performGraphFilterPlan(store, {
              filters: [Filters.includeNodeType(include)],
            })
          ).not.toThrow();
        });

        it("should only have included nodes", () => {
          expect(
            store.root.findAll({
              predicate: (node) =>
                !node.isGraphContainer && !include.includes(node.nodeType),
            }).length
          ).toBe(0);

          expect(store.counts.cfnResources).toMatchSnapshot();
        });
      });

      describe("excludeNodeType", () => {
        let store: Graph.Store;

        beforeAll(() => {
          store = originStore.clone();
        });

        const excluded = [NodeTypeEnum.OUTPUT, NodeTypeEnum.PARAMETER];

        it("should perform filter without error", () => {
          expect(() =>
            performGraphFilterPlan(store, {
              filters: [Filters.excludeNodeType(excluded)],
            })
          ).not.toThrow();
        });

        it("should not have excluded nodes", () => {
          expect(
            store.root.findAll({
              predicate: (node) => excluded.includes(node.nodeType),
            }).length
          ).toBe(0);

          expect(store.counts.cfnResources).toMatchSnapshot();
        });
      });
    });

    describe("cfnType", () => {
      describe("includeCfnType", () => {
        let store: Graph.Store;

        beforeAll(() => {
          store = originStore.clone();
        });

        const filterTypes = [
          CfnFunction.CFN_RESOURCE_TYPE_NAME,
          CfnRole.CFN_RESOURCE_TYPE_NAME,
        ];

        it("should perform filter without error", () => {
          expect(() =>
            performGraphFilterPlan(store, {
              filters: [Filters.includeCfnType(filterTypes)],
            })
          ).not.toThrow();
        });

        it("should only have included types", () => {
          expect(
            store.root.findAll({
              predicate: (node) =>
                !!node.cfnType && !filterTypes.includes(node.cfnType),
            }).length
          ).toBe(0);

          expect(store.counts.cfnResources).toMatchSnapshot();
        });
      });

      describe("excludeCfnType", () => {
        let store: Graph.Store;

        beforeAll(() => {
          store = originStore.clone();
        });

        const filterTypes = [
          CfnFunction.CFN_RESOURCE_TYPE_NAME,
          CfnRole.CFN_RESOURCE_TYPE_NAME,
        ];

        it("should perform filter without error", () => {
          expect(() =>
            performGraphFilterPlan(store, {
              filters: [Filters.excludeCfnType(filterTypes)],
            })
          ).not.toThrow();
        });

        it("should not have excluded types", () => {
          expect(
            store.root.findAll({
              predicate: (node) =>
                !!node.cfnType && filterTypes.includes(node.cfnType),
            }).length
          ).toBe(0);

          expect(store.counts.cfnResources).toMatchSnapshot();
        });
      });

      describe("excludeCfnType", () => {
        let store: Graph.Store;

        beforeAll(() => {
          store = originStore.clone();
        });

        const filterTypes = [
          CfnFunction.CFN_RESOURCE_TYPE_NAME,
          CfnRole.CFN_RESOURCE_TYPE_NAME,
        ];

        it("should perform filter without error", () => {
          expect(() =>
            performGraphFilterPlan(store, {
              filters: [Filters.excludeCfnType(filterTypes)],
            })
          ).not.toThrow();
        });

        it("should not have filter types nodes", () => {
          expect(
            store.root.findAll({
              predicate: (node) =>
                !!node.cfnType && filterTypes.includes(node.cfnType),
            }).length
          ).toBe(0);

          expect(store.counts.cfnResources).toMatchSnapshot();
        });
      });
    });

    describe("uncluster", () => {
      let store: Graph.Store;

      beforeAll(() => {
        store = originStore.clone();
      });

      const clusterType = NodeTypeEnum.NESTED_STACK;

      it("should initially contain cluster of type to filter", () => {
        expect(store.counts.nodeTypes[clusterType]).toBeGreaterThan(0);
      });

      it("should perform filter without error", () => {
        expect(() =>
          performGraphFilterPlan(store, {
            filters: [Filters.uncluster([clusterType])],
          })
        ).not.toThrow();
      });

      it("should not have nodes of filtered cluster type in store", () => {
        expect(store.counts.nodeTypes[clusterType]).toBe(0);
      });
    });
  });
});
