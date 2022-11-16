/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs-extra";
import {
  CdkGraph,
  FlagEnum,
  Graph,
  NodeTypeEnum,
  SerializedGraph,
} from "../../src";
import { MultiFixtureApp } from "../__fixtures__/apps";
import * as testUtils from "./test-utils";

const makeCdkOutdir = async (name: string) => testUtils.makeCdkOutDir("compute", name)

describe("cdk-graph/interface", () => {
  describe("core", () => {
    let outdir: string;
    let graphJsonFile: string;
    let app: MultiFixtureApp;
    let graph: CdkGraph;
    let store: Graph.Store;

    beforeAll(async () => {
      outdir = await makeCdkOutdir("complex-app");

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

    describe("store", () => {
      it("should register all nodes in the tree along with typed mappings", () => {
        const rootStacks: Graph.StackNode[] = [];

        for (const node of store.root.findAll()) {
          expect(() => store.getNode(node.uuid)).not.toThrow();
          expect(node.store).toBe(store);

          switch (node.nodeType) {
            case NodeTypeEnum.STAGE:
              expect(() => store.getStage(node.uuid)).not.toThrow();
              break;
            case NodeTypeEnum.STACK:
              rootStacks.push(node as Graph.StackNode);
              expect(() => store.getStack(node.uuid)).not.toThrow();
              break;
            case NodeTypeEnum.NESTED_STACK:
              expect(() => store.getStack(node.uuid)).not.toThrow();
              break;
          }
        }

        expect(store.rootStacks).toEqual(rootStacks);
      });
    });

    describe("entity", () => {
      const TEST_ENTITY_UUID = "TEST_UUID";
      let entity: Graph.BaseEntity;

      beforeEach(() => {
        class TestEntity extends Graph.BaseEntity {
          constructor() {
            super({
              store,
              uuid: TEST_ENTITY_UUID,
            });
          }

          mutateDestroy(_strict?: boolean | undefined): void {
            throw new Error("Method not implemented.");
          }
        }
        entity = new TestEntity();
      });

      describe("attributes", () => {
        it("should not allow direct manipulation", () => {
          const _attributes = entity.attributes;
          // @ts-ignore
          entity.attributes.foo = "test";
          expect(entity.attributes).toEqual(_attributes);
        });

        it("should add, get, and has", () => {
          entity.addAttribute("foo", "test");
          expect(entity.getAttribute("foo")).toEqual("test");
          expect(entity.hasAttribute("foo")).toBeTruthy();
          expect(entity.hasAttribute("foo", "test")).toBeTruthy();
          expect(entity.hasAttribute("foo", "not-test")).toBeFalsy();
        });

        it("should require set to overwrite existing", () => {
          entity.addAttribute("bar", "test");
          expect(() => entity.addAttribute("bar", "test")).toThrow();
          entity.setAttribute("bar", "test2");
          expect(entity.getAttribute("bar")).toEqual("test2");
        });
      });

      describe("tags", () => {
        it("should not allow direct manipulation", () => {
          const _tags = entity.tags;
          // @ts-ignore
          entity.tags.foo = "test";
          expect(entity.tags).toEqual(_tags);
        });

        it("should add, get, has", () => {
          entity.addTag("foo", "test");
          expect(entity.getTag("foo")).toEqual("test");
          expect(entity.hasTag("foo")).toBeTruthy();
          expect(entity.hasTag("foo", "test")).toBeTruthy();
          expect(entity.hasTag("foo", "not-test")).toBeFalsy();
        });

        it("should require set to overwrite existing", () => {
          entity.addTag("bar", "test");
          expect(() => entity.addTag("bar", "test")).toThrow();
          entity.setTag("bar", "test2");
          expect(entity.getTag("bar")).toEqual("test2");
        });
      });

      describe("metadata", () => {
        it("should not allow direct manipulation", () => {
          const _metadata = entity.metadata;
          entity.metadata.push({ type: "foo", data: "test" });
          expect(entity.metadata).toEqual(_metadata);
        });

        it("should add and has", () => {
          entity.addMetadata("foo", "test");
          expect(entity.hasMetadata("foo", "test")).toBeTruthy();
        });

        it("should find multiple", () => {
          entity.addMetadata("m", "a");
          entity.addMetadata("m", "b");
          entity.addMetadata("m", "c");
          expect(entity.findMetadata("m").map((entry) => entry.data)).toEqual([
            "a",
            "b",
            "c",
          ]);
        });
      });

      describe("flags", () => {
        const TEST_FLAG = "TEST" as FlagEnum;

        it("should not allow direct manipulation", () => {
          const _flags = entity.flags;
          entity.flags.push(TEST_FLAG);
          expect(entity.flags).toEqual(_flags);
        });

        it("should add and has", () => {
          expect(entity.hasTag(TEST_FLAG)).toBeFalsy();
          entity.addFlag(TEST_FLAG);
          expect(entity.hasFlag(TEST_FLAG)).toBeTruthy();
        });
      });

      describe("applyData", () => {
        const NEW_DATA: Required<Graph.IBaseEntityDataProps> = {
          attributes: {
            a1: "_a1",
            a2: { aa1: "_aa1", aa2: "_aa2" },
          },
          metadata: [{ type: "m1", data: "_m1" }],
          tags: {
            t1: "_t1",
            t2: "_t2",
          },
          flags: [FlagEnum.EXTRANEOUS],
        };
        const OVERWRITE_DATA: Required<Graph.IBaseEntityDataProps> = {
          attributes: {
            a1: "_a1_overwrite",
            a2: { aa1: "_aa1_overwrite", aa2: "_aa2_overwrite" },
          },
          metadata: [
            // data is same, should not add new entry
            { type: "m1", data: "_m1" },
          ],
          tags: {
            t1: "_t1_overwrite",
            t2: "_t2_overwrite",
          },
          flags: [FlagEnum.CLUSTER],
        };
        it("should apply new data", () => {
          entity.applyData(NEW_DATA);
          expect(entity.attributes).toMatchObject<SerializedGraph.Attributes>(
            NEW_DATA.attributes
          );
          expect(entity.metadata).toMatchObject<SerializedGraph.Metadata>(
            NEW_DATA.metadata
          );
          expect(entity.tags).toMatchObject<SerializedGraph.Tags>(
            NEW_DATA.tags
          );
          // flags should NOT be set by default
          expect(entity.flags).toMatchObject<FlagEnum[]>([]);
        });

        it("should not overwrite data by default", () => {
          entity.applyData(NEW_DATA);
          entity.applyData(OVERWRITE_DATA);
          expect(entity.attributes).toMatchObject<SerializedGraph.Attributes>(
            NEW_DATA.attributes
          );
          expect(entity.metadata).toMatchObject<SerializedGraph.Metadata>(
            NEW_DATA.metadata
          );
          expect(entity.tags).toMatchObject<SerializedGraph.Tags>(
            NEW_DATA.tags
          );
          // flags should NOT be set by default
          expect(entity.flags).toMatchObject<FlagEnum[]>([]);
        });

        it("should overwrite data when indicated", () => {
          entity.applyData(NEW_DATA);
          entity.applyData(OVERWRITE_DATA, true, true);
          expect(entity.attributes).toMatchObject<SerializedGraph.Attributes>(
            OVERWRITE_DATA.attributes
          );
          expect(entity.metadata).toMatchObject<SerializedGraph.Metadata>(
            OVERWRITE_DATA.metadata
          );
          expect(entity.tags).toMatchObject<SerializedGraph.Tags>(
            OVERWRITE_DATA.tags
          );
          expect(entity.flags).toMatchObject<FlagEnum[]>(OVERWRITE_DATA.flags);
        });
      });
    });
  });
});
