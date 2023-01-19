/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { assert } from "console";
import { ConstructOrder } from "constructs";
import cloneDeep = require("lodash.clonedeep"); // eslint-disable-line @typescript-eslint/no-require-imports
import isEmpty = require("lodash.isempty"); // eslint-disable-line @typescript-eslint/no-require-imports
import omit = require("lodash.omit"); // eslint-disable-line @typescript-eslint/no-require-imports
import uniq = require("lodash.uniq"); // eslint-disable-line @typescript-eslint/no-require-imports
import { Counter, ICounterRecord } from "./counter";
import {
  NodeTypeEnum,
  UUID,
  LOGICAL_ID,
  SerializedGraph,
  ConstructInfoFqnEnum,
  CfnAttributesEnum,
  LOGICAL_UNIVERSAL_ID,
  EdgeTypeEnum,
  ReferenceTypeEnum,
  FlagEnum,
  EdgeDirectionEnum,
  CdkConstructIds,
} from "./types";
import { ConstructInfo } from "../cdk-internals";

/** Public cdk-graph interface */
export namespace Graph {
  /**
   * Interface for store counters
   * @internal
   */
  export interface IStoreCounters {
    /** Counts total number of each *node type* ({@link NodeTypeEnum}) */
    readonly nodeTypes: Counter<NodeTypeEnum>;
    /** Counts total number of each *edge type* ({@link EdgeTypeEnum}) */
    readonly edgeTypes: Counter<EdgeTypeEnum>;
    /** Counts total number of each *cfnResourceType* */
    readonly cfnResources: Counter;
  }

  /** Interface for store counts */
  export interface IStoreCounts {
    /** Counts total number of nodes in the store */
    readonly nodes: number;
    /** Counts total number of edges in the store */
    readonly edges: number;
    /** Counts total number of stacks in the store */
    readonly stacks: number;
    /** Counts total number of stages in the store */
    readonly stages: number;
    /** Returns {@link ICounterRecord} containing total number of each *node type* ({@link NodeTypeEnum}) */
    readonly nodeTypes: ICounterRecord;
    /** Returns {@link ICounterRecord} containing total number of each *edge type* ({@link EdgeTypeEnum}) */
    readonly edgeTypes: ICounterRecord;
    /** Returns {@link ICounterRecord} containing total number of each *cfnResourceType* */
    readonly cfnResources: ICounterRecord;
  }

  /** Store class provides the in-memory database-like interface for managing all entities in the graph */
  export class Store implements SerializedGraph.ISerializableGraphStore {
    /** Builds store from serialized store data */
    static fromSerializedStore(serializedStore: SerializedGraph.GraphStore) {
      return deserializeStore(serializedStore);
    }

    /** Current SemVer version of the store */
    readonly version = "0.0.0";

    /** @internal */
    private _root: RootNode;
    /** @internal */
    private _edges: Map<UUID, Edge> = new Map();
    /** @internal */
    private _nodes: Map<UUID, Node> = new Map();
    /** @internal */
    private _stacks: Map<UUID, StackNode> = new Map();
    /** @internal */
    private _stages: Map<UUID, StageNode> = new Map();
    /** @internal */
    private _logicalIdLookup: Map<LOGICAL_UNIVERSAL_ID, UUID> = new Map();

    /** @internal */
    private _counters: IStoreCounters = {
      cfnResources: new Counter(),
      nodeTypes: new Counter<NodeTypeEnum>(),
      edgeTypes: new Counter<EdgeTypeEnum>(),
    };

    /**
     * Indicates if the store allows destructive mutations.
     *
     * Destructive mutations are only allowed on clones of the store to prevent plugins and filters from
     * mutating the store for downstream plugins.
     *
     * All `mutate*` methods are only allowed on stores that allow destructive mutations.
     *
     * This behavior may change in the future if the need arises for plugins to pass mutated stores
     * to downstream plugins. But it will be done cautiously with ensuring the intent of
     * downstream plugin is to receive the mutated store.
     */
    readonly allowDestructiveMutations: boolean;

    constructor(allowDestructiveMutations: boolean = false) {
      this._root = new RootNode(this);
      this.allowDestructiveMutations = allowDestructiveMutations;
    }

    /**
     * Root node in the store. The **root** node is not the computed root, but the graph root
     * which is auto-generated and can not be mutated.
     */
    get root(): RootNode {
      return this._root;
    }

    /**
     * Gets all stored **edges**
     * @type ReadonlyArray<Edge>
     */
    get edges(): Edge[] {
      return Array.from(this._edges.values());
    }

    /**
     * Gets all stored **nodes**
     * @type ReadonlyArray<Node>
     */
    get nodes(): Node[] {
      return Array.from(this._nodes.values());
    }

    /**
     * Gets all stored **stack** nodes
     * @type ReadonlyArray<StackNode>
     */
    get stacks(): StackNode[] {
      return Array.from(this._stacks.values());
    }

    /**
     * Gets all stored **stage** nodes
     * @type ReadonlyArray<StageNode>
     */
    get stages(): StageNode[] {
      return Array.from(this._stages.values());
    }

    /**
     * Gets all stored **root stack** nodes
     * @type ReadonlyArray<StackNode>
     */
    get rootStacks(): StackNode[] {
      return this.stacks.filter((stack) => StackNode.isStackNode(stack));
    }

    /** Get record of all store counters */
    get counts(): IStoreCounts {
      return {
        nodes: this._nodes.size,
        edges: this._edges.size,
        stacks: this._stacks.size,
        stages: this._stages.size,
        nodeTypes: this._counters.nodeTypes.counts,
        edgeTypes: this._counters.edgeTypes.counts,
        cfnResources: this._counters.cfnResources.counts,
      };
    }

    /** Add **edge** to the store */
    addEdge(edge: Edge): void {
      this._edges.set(edge.uuid, edge);

      this._counters.edgeTypes.add(edge.edgeType);
    }

    /** Get stored **edge** by UUID */
    getEdge(uuid: UUID): Edge {
      const edge = this._edges.get(uuid);
      if (edge != null) {
        return edge;
      }
      throw new Error(`Edge ${uuid} is not defined`);
    }

    /** Add **node** to the store */
    addNode(node: Node): void {
      // Do not store root node
      if (RootNode.isRootNode(node) === true) {
        return;
      }

      this._nodes.set(node.uuid, node);

      this._counters.nodeTypes.add(node.nodeType);

      if (CfnResourceNode.isCfnResourceNode(node) && node.cfnType) {
        this._counters.cfnResources.add(node.cfnType);
      }
    }

    /** Get stored **node** by UUID */
    getNode(uuid: UUID): Node {
      // Root node is not stored in "nodes" map
      if (uuid === RootNode.UUID && this.root) {
        return this.root;
      }

      const node = this._nodes.get(uuid);
      if (node != null) {
        return node;
      }
      throw new Error(`Node ${uuid} is not defined`);
    }

    /** Add **stack** node to the store */
    addStack(stack: StackNode): void {
      this._stacks.set(stack.uuid, stack);
    }

    /** Get stored **stack** node by UUID */
    getStack(uuid: UUID): StackNode {
      const stack = this._stacks.get(uuid);
      if (stack != null) {
        return stack;
      }
      throw new Error(`Stack ${uuid} is not defined`);
    }

    /** Add **stage** to the store */
    addStage(stage: StageNode): void {
      this._stages.set(stage.uuid, stage);
    }

    /** Get stored **stage** node by UUID */
    getStage(uuid: UUID): StageNode {
      const stage = this._stages.get(uuid);
      if (stage != null) {
        return stage;
      }
      throw new Error(`Stage ${uuid} is not defined`);
    }

    /**
     * Compute **universal** *logicalId* based on parent stack and construct *logicalId* (`<stack>:<logicalId>`).
     *
     * Construct *logicalIds are only unique within their containing stack, so to use *logicalId*
     * lookups universally (like resolving references) we need a universal key.
     */
    computeLogicalUniversalId(
      stack: StackNode,
      logicalId: string
    ): LOGICAL_UNIVERSAL_ID {
      return `${stack.uuid}:${logicalId}`;
    }

    /** Find node by **universal** *logicalId* (`<stack>:<logicalId>`) */
    findNodeByLogicalUniversalId(uid: LOGICAL_UNIVERSAL_ID): Node {
      const [stackUUID, logicalId] = uid.split(":");
      const stack: StackNode = this.getStack(stackUUID);

      return this.findNodeByLogicalId(stack, logicalId);
    }

    /** Find node within given **stack** with given *logicalId* */
    findNodeByLogicalId(stack: StackNode, logicalId: string): Node {
      const uid = this.computeLogicalUniversalId(stack, logicalId);
      const nodeUUID = this._logicalIdLookup.get(uid);

      if (nodeUUID == null) {
        if (stack instanceof NestedStackNode && stack.parentStack) {
          return this.findNodeByLogicalId(stack.parentStack, logicalId);
        }

        throw new Error(`Failed to find node by logicalId: ${uid}`);
      }

      const node = this._nodes.get(nodeUUID);
      if (node != null) {
        return node;
      }
      throw new Error(`Unable to find node mapped to logical id ${logicalId}`);
    }

    /** Record a **universal** *logicalId* to node mapping in the store */
    recordLogicalId(stack: StackNode, logicalId: string, resource: Node): void {
      const uid = this.computeLogicalUniversalId(stack, logicalId);
      this._logicalIdLookup.set(uid, resource.uuid);
    }

    /** Serialize the store */
    serialize(): SerializedGraph.GraphStore {
      return {
        version: this.version,
        tree: this.root._serialize(),
        edges: Array.from(this.edges).map((edge) => edge._serialize()),
      };
    }

    /**
     * Clone the store to allow destructive mutations.
     * @param allowDestructiveMutations Indicates if destructive mutations are allowed; defaults to `true`
     * @returns {Store} Returns a clone of the store that allows destructive mutations
     */
    clone(allowDestructiveMutations: boolean = true): Store {
      return deserializeStore(this.serialize(), allowDestructiveMutations);
    }

    /**
     * Verifies that the store allows destructive mutations.
     * @throws Error is store does **not** allow mutations
     */
    verifyDestructiveMutationAllowed(): void {
      if (!this.allowDestructiveMutations) {
        throw new Error(
          "GraphStore must be a clone to perform destructive mutations"
        );
      }
    }

    /**
     * Remove **edge** from the store
     * @destructive
     */
    mutateRemoveEdge(edge: Edge): boolean {
      const deleted = this._edges.delete(edge.uuid);
      if (deleted) {
        this._counters.edgeTypes.subtract(edge.edgeType);
      }
      return deleted;
    }

    /**
     * Remove **node** from the store
     * @destructive
     */
    mutateRemoveNode(node: Node): boolean {
      // Root node can not be removed
      if (RootNode.isRootNode(node) === true) {
        throw new Error("Root not can not be removed");
      }

      if (node.logicalId && node.stack) {
        this._logicalIdLookup.delete(
          this.computeLogicalUniversalId(node.stack, node.logicalId)
        );
      }

      if (StackNode.isStackNode(node)) {
        this._stacks.delete(node.uuid);
      }

      const deleted = this._nodes.delete(node.uuid);
      if (deleted) {
        this._counters.nodeTypes.subtract(node.nodeType);

        if (CfnResourceNode.isCfnResourceNode(node) && node.cfnType) {
          this._counters.cfnResources.subtract(node.cfnType);
        }
      }
      return deleted;
    }
  }

  /** Base interface for all store entities **data** props */
  export interface IBaseEntityDataProps {
    /** Attributes */
    readonly attributes?: SerializedGraph.Attributes;
    /** Metadata entries */
    readonly metadata?: SerializedGraph.Metadata;
    /** Tags */
    readonly tags?: SerializedGraph.Tags;
    /** Flags */
    readonly flags?: FlagEnum[];
  }

  /** Base interface for all store entities props */
  export interface IBaseEntityProps extends IBaseEntityDataProps {
    /** Store */
    readonly store: Store;
    /** UUID */
    readonly uuid: UUID;
  }

  /** Base class for all store entities (Node and Edges) */
  export abstract class BaseEntity
    implements SerializedGraph.ISerializableEntity
  {
    /** Reference to the store */
    readonly store: Store;
    /** Universally unique identifier  */
    readonly uuid: UUID;

    /** @internal */
    private readonly _attributes: SerializedGraph.Attributes;
    /** @internal */
    private readonly _metadata: SerializedGraph.Metadata;
    /** @internal */
    private readonly _tags: Map<string, string>;
    /** @internal */
    private readonly _flags: Set<FlagEnum>;
    /** @internal */
    protected _destroyed: boolean = false;

    constructor(props: IBaseEntityProps) {
      this.store = props.store;
      this.uuid = props.uuid;
      this._attributes = props.attributes || {};
      this._metadata = props.metadata || [];
      this._tags = new Map(Object.entries(props.tags || {}));
      this._flags = new Set(props.flags);
    }

    /**
     * Get *readonly* record of all attributes
     * @type Readonly<SerializedGraph.Attributes>
     */
    get attributes(): SerializedGraph.Attributes {
      return cloneDeep(this._attributes);
    }

    /**
     * Get *readonly* list of all metadata entries
     * @type Readonly<SerializedGraph.Metadata>
     */
    get metadata(): SerializedGraph.Metadata {
      return cloneDeep(this._metadata);
    }

    /**
     * Get *readonly* record of all tags
     * @type Readonly<SerializedGraph.Tags>
     */
    get tags(): SerializedGraph.Tags {
      return Object.fromEntries(this._tags);
    }

    /**
     * Get *readonly* list of all flags
     * @type ReadonlyArray<FlagEnum>
     */
    get flags(): FlagEnum[] {
      return Array.from(this._flags);
    }

    /** Indicates if the entity has been destroyed (eg: removed from store) */
    get isDestroyed(): boolean {
      return this._destroyed;
    }

    /** Indicates if the entity has had destructive mutations applied */
    get isMutated(): boolean {
      return this.hasFlag(FlagEnum.MUTATED);
    }

    /** Indicates if entity has a given attribute defined, and optionally with a specific value */
    hasAttribute(key: string, value?: any): boolean {
      if (key in this._attributes) {
        if (value !== undefined) {
          return this._attributes[key] === value;
        }
        return true;
      }
      return false;
    }

    /**
     * Add attribute.
     *
     * @throws Error if attribute for key already exists
     */
    addAttribute(key: string, value: any): void {
      if (this.hasAttribute(key)) {
        throw new Error(
          `Entity ${String(
            this
          )} already has attribute ${key}; use setAttribute to override`
        );
      }
      this.setAttribute(key, value);
    }

    /** Set attribute. This will overwrite existing attribute. */
    setAttribute(key: string, value: any): void {
      // @ts-ignore
      this._attributes[key] = value;
    }

    /** Get attribute by key */
    getAttribute(key: string): any {
      return this._attributes[key];
    }

    /** Add metadata entry */
    addMetadata(metadataType: string, data: any): void {
      this._metadata.push({
        type: metadataType,
        data,
      });
    }

    /** Indicates if entity has matching metadata entry */
    hasMetadata(metadataType: string, data: any): boolean {
      return !!this._metadata.find((metadata) => {
        if (metadata.type !== metadataType) return false;
        if (metadata.data !== data) return false;
        return true;
      });
    }

    /**
     * Retrieves all metadata entries of a given type
     * @type Readonly<SerializedGraph.Metadata>
     */
    findMetadata(metadataType: string): SerializedGraph.Metadata {
      return this._metadata.filter((entry) => entry.type === metadataType);
    }

    /**
     * Add tag.
     * @throws Throws Error is tag for key already exists
     */
    addTag(key: string, value: string): void {
      if (this.hasTag(key)) {
        throw new Error(
          `Entity ${String(
            this
          )} already has tag ${key}; use setTag to override`
        );
      }
      this.setTag(key, value);
    }

    /** Set tag. Will overwrite existing tag. */
    setTag(key: string, value: string): void {
      this._tags.set(key, value);
    }

    /** Indicates if entity has tag, optionally verifying tag value */
    hasTag(key: string, value?: string): boolean {
      if (!this._tags.has(key)) return false;
      if (value !== undefined && this._tags.get(key) !== value) return false;
      return true;
    }

    /** Get tag by key */
    getTag(key: string): string | undefined {
      return this._tags.get(key);
    }

    /** Add flag */
    addFlag(flag: FlagEnum): void {
      this._flags.add(flag);
    }

    /** Indicates if entity has a given flag */
    hasFlag(flag: FlagEnum): boolean {
      return this._flags.has(flag);
    }

    /**
     * Applies data (attributes, metadata, tags, flag) to entity.
     *
     * Generally used only for mutations such as collapse and consume to retain data.
     * @param data - The data to apply
     * @param {boolean} [applyFlags=false] - Indicates if data is overwritten
     * @param {boolean} [applyFlags=false] - Indicates if flags should be applied
     */
    applyData(
      data: IBaseEntityDataProps,
      overwrite: boolean = false,
      applyFlags: boolean = false
    ): void {
      if (data.attributes) {
        Object.entries(data.attributes).forEach(([key, value]) => {
          if (overwrite || !this.hasAttribute(key)) {
            this.setAttribute(key, value);
          }
        });
      }

      if (data.metadata) {
        data.metadata.forEach((v) => {
          if (!this.hasMetadata(v.type, v.data)) {
            this.addMetadata(v.type, v.data);
          }
        });
      }

      if (data.tags) {
        Object.entries(data.tags).forEach(([key, value]) => {
          if (overwrite || !this.hasTag(key)) {
            this.setTag(key, value);
          }
        });
      }

      if (applyFlags && data.flags) {
        data.flags.forEach((flag) => {
          this.addFlag(flag);
        });
      }
    }

    /**
     * Performs pre-mutate operations on entity and store
     * @internal
     */
    protected _preMutate(): void {
      this.store.verifyDestructiveMutationAllowed();
      this.addFlag(FlagEnum.MUTATED);
    }

    /**
     * Destroy the entity be removing all references and removing from store.
     * @param {boolean} [strict=false] - If `strict`, then entity must not have any references remaining when attempting to destroy
     * @destructive
     */
    abstract mutateDestroy(strict?: boolean): void;

    /**
     * Serialize entity
     * @internal
     */
    _serialize(): SerializedGraph.Entity {
      return {
        uuid: this.uuid,
        attributes: isEmpty(this._attributes) ? undefined : this._attributes,
        metadata: isEmpty(this._metadata) ? undefined : this._metadata,
        tags: this._tags.size ? Object.fromEntries(this._tags) : undefined,
        flags: this._flags.size ? Array.from(this._flags) : undefined,
      };
    }
  }

  /** Base edge props agnostic to edge type. Used for extending per edge class with type specifics. */
  export interface ITypedEdgeProps extends IBaseEntityProps {
    /** Edge **source** is the node that defines the edge (tail) */
    readonly source: Node;
    /** Edge **target** is the node being referenced by the **source** (head) */
    readonly target: Node;
  }

  /** Edge props interface */
  export interface IEdgeProps extends ITypedEdgeProps {
    /** Indicates the direction in which the edge is directed */
    readonly direction: EdgeDirectionEnum;
    /** Type of edge */
    readonly edgeType: EdgeTypeEnum;
  }

  /**
   * EdgeCain defines an edge traversal path to terminal point.
   *
   * An edge may reference an *OutputNode* which is just a proxy to actual *ResourceNode*, in which case
   * the target node expected is generally the *ResourceNode*. An EdgeChain defines this resolution path
   * to the expected target.
   */
  export type EdgeChain = [Edge, ...EdgeChain[]];

  /** Edge class defines a link (relationship) between nodes, as in standard [graph theory](https://en.wikipedia.org/wiki/Graph_theory) */
  export class Edge
    extends BaseEntity
    implements SerializedGraph.ISerializableEdge
  {
    /** Find first edge matching predicate within an EdgeChain */
    static findInChain(
      chain: EdgeChain,
      predicate: IEdgePredicate
    ): Edge | undefined {
      for (const entry of chain) {
        if (Array.isArray(entry)) {
          const edge = Edge.findInChain(entry, predicate);
          if (edge) return edge;
        } else {
          if (predicate(entry)) return entry;
        }
      }

      return undefined;
    }

    /** Find all matching edges based on predicate within an EdgeChain */
    static findAllInChain(chain: EdgeChain, predicate: IEdgePredicate): Edge[] {
      const edges: Edge[] = [];
      for (const entry of chain) {
        if (Array.isArray(entry)) {
          const edge = Edge.findInChain(entry, predicate);
          if (edge) {
            edges.push(edge);
          }
        } else {
          if (predicate(entry)) {
            edges.push(entry);
          }
        }
      }

      return edges;
    }

    /** Type of edge */
    readonly edgeType: EdgeTypeEnum;

    /** @internal */
    private _source: Node;
    /** @internal */
    private _target: Node;
    /** @internal */
    private _direction: EdgeDirectionEnum;

    /** Edge **source** is the node that defines the edge (tail) */
    get source(): Node {
      return this._source;
    }
    /** Edge **target** is the node being referenced by the **source** (head) */
    get target(): Node {
      return this._target;
    }
    /** Indicates the direction in which the edge is directed */
    get direction(): EdgeDirectionEnum {
      return this._direction;
    }

    /** Indicates if **source** and **target** nodes reside in different *root* stacks */
    get isCrossStack(): boolean {
      return this._source.rootStack !== this._target.rootStack;
    }

    /**
     * Indicates if the Edge's **source** and **target** are the same, or were the same
     * when it was created (prior to mutations).
     *
     * To check whether it was originally closed, use `hasFlag(FlagEnum.CLOSED_EDGE)` instead.
     */
    get isClosed(): boolean {
      return (
        this._source === this._target || this.hasFlag(FlagEnum.CLOSED_EDGE)
      );
    }

    /**
     * Indicates if edge is extraneous which is determined by explicitly having *EXTRANEOUS* flag
     * added and/or being a closed loop (source===target).
     */
    get isExtraneous(): boolean {
      return this.hasFlag(FlagEnum.EXTRANEOUS) || this.isClosed;
    }

    constructor(props: IEdgeProps) {
      super(props);

      this.edgeType = props.edgeType;
      this._direction = props.direction;
      this._source = props.source;
      this._target = props.target;

      // Do not change original closed edge flag from a mutation.
      if (this._target === this._source && this.hasFlag(FlagEnum.MUTATED)) {
        this.addFlag(FlagEnum.CLOSED_EDGE);
      }

      // wire up links
      this._source.addLink(this);
      this._target.addReverseLink(this);

      this.store.addEdge(this);
    }

    /**
     * Indicates if this edge is equivalent to another edge.
     *
     * Edges are considered equivalent if they share same type, source, and target.
     */
    isEquivalent(edge: Edge): boolean {
      if (edge.edgeType !== this.edgeType) return false;
      if (edge.source !== this.source) return false;
      if (edge.target !== this.target) return false;
      return true;
    }

    /** Indicates if edge allows destructive mutations */
    get allowDestructiveMutations(): boolean {
      return this.store.allowDestructiveMutations;
    }

    /**
     * Change the edge **direction**
     * @destructive
     */
    mutateDirection(direction: EdgeDirectionEnum): void {
      this._preMutate();

      this._direction = direction;
    }

    /**
     * Change the edge **source**
     * @destructive
     */
    mutateSource(node: Node): void {
      this._preMutate();

      this._source.mutateRemoveLink(this);
      this._source = node;
      this._source.addLink(this);
    }

    /**
     * Change the edge **target**
     * @destructive
     */
    mutateTarget(node: Node): void {
      this._preMutate();

      this._target.mutateRemoveReverseLink(this);
      this._target = node;
      this._target.addReverseLink(this);
    }

    /**
     * Destroy the edge. Remove all references and remove from store.
     * @destructive
     */
    mutateDestroy(_strict: boolean = false): void {
      this._preMutate();

      this.source.mutateRemoveLink(this);
      this.target.mutateRemoveReverseLink(this);

      this.store.mutateRemoveEdge(this);
      this._destroyed = true;
    }

    /**
     * Merge an equivalent edge's data into this edge and destroy the other edge.
     *
     * Used during filtering operations to consolidate equivalent edges.
     * @param edge - The edge to consume
     * @throws Error is edge is not *equivalent*
     * @destructive
     */
    mutateConsume(edge: Edge): void {
      this._preMutate();
      if (!this.isEquivalent(edge)) {
        throw new Error(
          `Only equivalent edges can be consumed: ${edge} > ${this}`
        );
      }

      // propagate edge data
      this.applyData(edge);

      // destroy the consumed edge
      edge.mutateDestroy();
    }

    /** Get string representation of this edge */
    toString(): string {
      return `Edge:${this.edgeType}::${this.uuid}::${this.direction}(${this.source}->${this.target})`;
    }

    /** @internal */
    _serialize(): SerializedGraph.Edge {
      return {
        ...super._serialize(),
        edgeType: this.edgeType,
        direction: this.direction,
        source: this.source.uuid,
        target: this.target.uuid,
      };
    }
  }

  /** Dependency edge class defines CloudFormation dependency between resources */
  export class Dependency extends Edge {
    /** Edge prefix to denote dependency edge  */
    static readonly PREFIX = "DEP:";

    /** Indicates if given edge is a {@link Dependency} edge */
    static isDependency(edge: Edge): edge is Reference {
      return (edge as Reference).edgeType === EdgeTypeEnum.DEPENDENCY;
    }

    constructor(props: ITypedEdgeProps) {
      super({
        ...props,
        edgeType: EdgeTypeEnum.DEPENDENCY,
        direction: EdgeDirectionEnum.FORWARD,
      });

      this.addFlag(FlagEnum.EXTRANEOUS);
    }
  }

  /** Reference edge props */
  export interface IReferenceProps extends ITypedEdgeProps {
    /** Type of reference */
    referenceType?: ReferenceTypeEnum;
  }

  /** Reference edge class defines a directed relationship between nodes  */
  export class Reference extends Edge {
    /** Edge prefix to denote **Ref** type reference edge  */
    static readonly PREFIX: string = "REF:";
    /** Attribute defining the type of reference */
    static readonly ATT_TYPE = "graph:reference:type";

    /** Indicates if edge is a {@link Reference} */
    static isReference(edge: Edge): edge is Reference {
      return (edge as Reference).edgeType === EdgeTypeEnum.REFERENCE;
    }

    /** Indicates if edge is a **Ref** based {@link Reference} edge */
    static isRef(edge: Edge): edge is Reference {
      return (edge as Reference).referenceType === ReferenceTypeEnum.REF;
    }

    constructor(props: IReferenceProps) {
      super({
        edgeType: EdgeTypeEnum.REFERENCE,
        direction: EdgeDirectionEnum.FORWARD,
        ...props,
      });

      this.setAttribute(
        Reference.ATT_TYPE,
        props.referenceType || ReferenceTypeEnum.REF
      );
    }

    /** Get type of reference */
    get referenceType(): ReferenceTypeEnum {
      return this.getAttribute(Reference.ATT_TYPE);
    }

    /** Resolve reference chain */
    resolveChain(): EdgeChain {
      if (OutputNode.isOutputNode(this.target)) {
        function _resolveChain(_ref: Edge): EdgeChain {
          if (OutputNode.isOutputNode(_ref.target)) {
            return [
              _ref,
              ...(_ref.target as OutputNode).referenceLinks.map(_resolveChain),
            ];
          }
          return [_ref];
        }
        return [
          this,
          ...(this.target as OutputNode).referenceLinks.map(_resolveChain),
        ];
      }
      return [this];
    }

    /**
     * Resolve targets by following potential edge chain.
     *
     * @see {@link EdgeChain}
     */
    resolveTargets(): Node[] {
      if (OutputNode.isOutputNode(this.target)) {
        function resolveOutputTarget(_target: Node): Node[] {
          if (OutputNode.isOutputNode(_target))
            return resolveOutputTarget(_target);
          return [_target];
        }
        return (this.target as OutputNode).referenceLinks.flatMap((ref) =>
          resolveOutputTarget(ref.target)
        );
      }
      return [this.target];
    }
  }

  /** Attribute type reference props */
  export interface IAttributeReferenceProps extends ITypedEdgeProps {
    /** Resolved attribute value */
    value: SerializedGraph.Value;
  }

  /** Attribute type reference edge */
  export class AttributeReference extends Reference {
    /** Edge prefix to denote **Fn::GetAtt** type reference edge  */
    static readonly PREFIX: string = "ATT:";
    /** Attribute key for resolved value of attribute reference */
    static readonly ATT_VALUE = "graph:reference:attribute:value";

    /** Indicates if edge in an **Fn::GetAtt** {@link Reference} */
    static isAtt(edge: Edge): edge is AttributeReference {
      return (edge as Reference).referenceType === ReferenceTypeEnum.ATTRIBUTE;
    }

    constructor(props: IAttributeReferenceProps) {
      super({
        ...props,
        referenceType: ReferenceTypeEnum.ATTRIBUTE,
      });

      this.setAttribute(AttributeReference.ATT_VALUE, props.value);
    }

    /** Get the resolved attribute value */
    get value(): string {
      return this.getAttribute(AttributeReference.ATT_VALUE);
    }
  }

  /** Import reference defines **Fn::ImportValue** type reference edge. */
  export class ImportReference extends Reference {
    /** Edge prefix to denote **Fn::ImportValue** type reference edge */
    static readonly PREFIX: string = "IMP:";

    /** Indicates if edge is **Fn::ImportValue** based {@link Reference} */
    static isImport(edge: Edge): edge is ImportReference {
      return (edge as Reference).referenceType === ReferenceTypeEnum.IMPORT;
    }

    constructor(props: ITypedEdgeProps) {
      super({
        ...props,
        referenceType: ReferenceTypeEnum.IMPORT,
      });
    }
  }

  /** Base node props agnostic to node type. Used for extending per node class with type specifics. */
  export interface ITypedNodeProps extends IBaseEntityProps {
    /** Node id, which is unique within parent scope */
    readonly id: string;
    /** Path of the node */
    readonly path: string;

    /** Stack the node is contained */
    readonly stack?: StackNode;
    /** Parent node */
    readonly parent?: Node;
    /** Synthesized construct information defining jii resolution data */
    readonly constructInfo?: ConstructInfo;
    /** Logical id of the node, which is only unique within containing stack */
    readonly logicalId?: string;
    /** Type of CloudFormation resource */
    readonly cfnType?: string;
  }

  /** Node props */
  export interface INodeProps extends ITypedNodeProps {
    /** Type of node */
    readonly nodeType: NodeTypeEnum;
  }

  /** Predicate to match node */
  export interface INodePredicate {
    (node: Node): boolean;
  }

  /** Predicate to match edge */
  export interface IEdgePredicate {
    (edge: Edge): boolean;
  }

  /** Options for node based search operations */
  export interface IFindNodeOptions {
    /** The predicate to match node(s) */
    predicate?: INodePredicate;
    /** The order of traversal during search path */
    order?: ConstructOrder;
  }

  /** Options for edge based search operations */
  export interface IFindEdgeOptions {
    /** The predicate to match edges(s) */
    predicate?: IEdgePredicate;
    /** The order of traversal during search path */
    order?: ConstructOrder;
    /** Indicates reverse order */
    reverse?: boolean;
  }

  /** Node class is the base definition of **node** entities in the graph, as in standard [graph theory](https://en.wikipedia.org/wiki/Graph_theory) */
  export class Node
    extends BaseEntity
    implements SerializedGraph.ISerializableNode
  {
    /** Type of node */
    readonly nodeType: NodeTypeEnum;
    /** Node id, which is only unique within parent scope */
    readonly id: string;
    /** Path of the node */
    readonly path: string;

    /** @internal */
    private _stack?: StackNode;
    /** @internal */
    private _parent?: Node;

    /** Stack the node is contained in */
    get stack(): StackNode | undefined {
      return this._stack;
    }

    /** Parent node. Only the root node should not have parent. */
    get parent(): Node | undefined {
      return this._parent;
    }

    /** Synthesized construct information defining jii resolution data */
    readonly constructInfo?: ConstructInfo;
    /** Logical id of the node, which is only unique within containing stack */
    readonly logicalId?: LOGICAL_ID;

    /** @internal */
    protected _cfnType?: string;

    /** @internal */
    protected readonly _children: Map<string, Node> = new Map();

    /** @internal */
    protected readonly _links: Map<UUID, Edge> = new Map();

    /** @internal */
    protected readonly _reverseLinks: Map<UUID, Edge> = new Map();

    /** Indicates the depth of the node relative to root (0) */
    readonly depth: number;

    constructor(props: INodeProps) {
      super(props);

      this.nodeType = props.nodeType;
      this.id = props.id;
      this.path = props.path;

      this.constructInfo = props.constructInfo;
      this._cfnType = props.cfnType;

      this._parent = props.parent;
      this.depth = this.parent ? this.parent.depth + 1 : 0;

      this._stack =
        props.stack || (this instanceof StackNode ? this : undefined);

      this.logicalId = props.logicalId;
      if (this.logicalId) {
        if (this.stack == null) {
          throw new Error(
            `LogicalId defined outside of stack: ${this.logicalId} - ${String(
              this
            )}`
          );
        }
        this.store.recordLogicalId(this.stack, this.logicalId, this);
      }

      if (this.parent) {
        this.parent.addChild(this);
      }

      this.store.addNode(this);
    }

    /** Gets descending ordered list of ancestors from the root */
    get scopes(): Node[] {
      if (this.parent) {
        return [...this.parent.scopes, this.parent];
      }
      return [];
    }

    /** Indicates if node is direct child of the graph root node */
    get isTopLevel(): boolean {
      return this.parent === this.store.root;
    }

    /** Get **root** stack */
    get rootStack(): StackNode | undefined {
      if (StackNode.isStackNode(this)) return this;
      return this.scopes.find((scope) =>
        StackNode.isStackNode(scope)
      ) as StackNode;
    }

    /** Get all direct child nodes */
    get children(): Node[] {
      return Array.from(this._children.values());
    }

    /** Indicates if this node is a *leaf* node, which means it does not have children */
    get isLeaf(): boolean {
      return this._children.size === 0;
    }

    /** Gets all links (edges) in which this node is the **source** */
    get links(): Edge[] {
      return Array.from(this._links.values());
    }

    /** Gets all links (edges) in which this node is the **target** */
    get reverseLinks(): Edge[] {
      return Array.from(this._reverseLinks.values());
    }

    /** Synthesized construct information defining jii resolution data */
    get constructInfoFqn(): string | undefined {
      return this.constructInfo?.fqn;
    }

    /** Indicates if node is a *Custom Resource* */
    get isCustomResource(): boolean {
      return ConstructInfoFqnEnum.CUSTOM_RESOURCE === this.constructInfoFqn;
    }

    /** Gets CloudFormation properties for this node */
    get cfnProps(): SerializedGraph.PlainObject | undefined {
      return this.attributes[CfnAttributesEnum.PROPS] as
        | SerializedGraph.PlainObject
        | undefined;
    }

    /** Get the CloudFormation resource type for this node */
    get cfnType(): string | undefined {
      return this._cfnType;
    }

    /** Gets list of {@link Dependency} links (edges) where this node is the **source** */
    get dependencyLinks(): Dependency[] {
      return Array.from(this._links.values()).filter((link) => {
        return link.edgeType === EdgeTypeEnum.DEPENDENCY;
      }) as Dependency[];
    }

    /** Gets list of {@link Dependency} links (edges) where this node is the **target** */
    get reverseDependencyLinks(): Dependency[] {
      return Array.from(this._links.values()).filter((link) => {
        return link.edgeType === EdgeTypeEnum.DEPENDENCY;
      }) as Dependency[];
    }

    /** Gets list of {@link Reference} links (edges) where this node is the **source** */
    get referenceLinks(): Reference[] {
      return Array.from(this._links.values()).filter((link) => {
        return link.edgeType === EdgeTypeEnum.REFERENCE;
      }) as Reference[];
    }

    /** Gets list of {@link Reference} links (edges) where this node is the **target** */
    get reverseReferenceLinks(): Reference[] {
      return Array.from(this._links.values()).filter((link) => {
        return link.edgeType === EdgeTypeEnum.REFERENCE;
      }) as Reference[];
    }

    /**
     * Get list of **Nodes** that *this node references*
     * @see {@link Node.referenceLinks}
     */
    get references(): Node[] {
      return uniq(this.referenceLinks.flatMap((link) => link.resolveTargets()));
    }

    /**
     * Get list of **Nodes** that *reference this node*
     * @see {@link Node.reverseReferenceLinks}
     */
    get referencedBy(): Node[] {
      return uniq(
        this.reverseReferenceLinks.flatMap((link) => link.resolveTargets())
      );
    }

    /**
     * Get list of **Nodes** that *this node depends on*
     * @see {@link Node.dependencyLinks}
     */
    get dependencies(): Node[] {
      return uniq(this.dependencyLinks.flatMap((link) => link.target));
    }

    /**
     * Get list of **Nodes** that *depend on this node*
     * @see {@link Node.reverseDependencyLinks}
     */
    get dependedOnBy(): Node[] {
      return uniq(this.reverseDependencyLinks.flatMap((link) => link.target));
    }

    /** Indicates if this node is considered a {@link FlagEnum.GRAPH_CONTAINER} */
    get isGraphContainer(): boolean {
      return this.hasFlag(FlagEnum.GRAPH_CONTAINER);
    }
    /** Indicates if this node is considered a {@link FlagEnum.CLUSTER} */
    get isCluster(): boolean {
      return this.hasFlag(FlagEnum.CLUSTER);
    }
    /**
     * Indicates if this node is considered a {@link FlagEnum.EXTRANEOUS} node
     * or determined to be extraneous:
     * - Clusters that contain no children
     */
    get isExtraneous(): boolean {
      return (
        this.hasFlag(FlagEnum.EXTRANEOUS) || (this.isCluster && this.isLeaf)
      );
    }
    /** Indicates if this node is considered a {@link FlagEnum.RESOURCE_WRAPPER} */
    get isResourceWrapper(): boolean {
      return this.hasFlag(FlagEnum.RESOURCE_WRAPPER);
    }
    /** Indicates if this node is considered a {@link FlagEnum.ASSET} */
    get isAsset(): boolean {
      return this.hasFlag(FlagEnum.ASSET);
    }

    /** Get list of *siblings* of this node. */
    get siblings(): Node[] {
      if (this.parent) {
        return this.parent.children.filter((child) => child !== this);
      }
      return [];
    }

    /** Get specific CloudFormation property */
    getCfnProp(key: string): SerializedGraph.Value | undefined {
      return this.cfnProps && this.cfnProps[key];
    }

    /** Add *link* to another node */
    addLink(edge: Edge): void {
      this._links.set(edge.uuid, edge);
    }

    /** Add *link* from another node */
    addReverseLink(edge: Edge): void {
      this._reverseLinks.set(edge.uuid, edge);
    }

    /** Add *child* node */
    addChild(node: Node): void {
      this._children.set(node.id, node);
    }

    /** Indicates if specific *node* is a *child* of *this node* */
    isChild(node: Node): boolean {
      for (const child of this._children.values()) {
        if (child === node) return true;
      }
      return false;
    }

    /** Indicates if a specific *node* is an *ancestor* of *this node* */
    isAncestor(ancestor: Node): boolean {
      return this.scopes.includes(ancestor);
    }

    /**
     * Find nearest *ancestor* of *this node* matching given predicate.
     * @param predicate - Predicate to match ancestor
     * @max {number} [max] - Optional maximum levels to ascend
     */
    findAncestor(predicate: INodePredicate, max?: number): Node | undefined {
      let ancestors = this.scopes.slice().reverse();
      if (max) {
        ancestors = ancestors.slice(0, max);
      }
      return ancestors.find(predicate);
    }

    /**
     * Gets the nearest **common** *ancestor* shared between *this node* and another *node*.
     * @throws Error if *node* does not share a **common** *ancestor*
     */
    getNearestAncestor(node: Node): Node {
      if (node === this) throw new Error("Node is the current node");

      const aScopes = this.scopes;
      const bScopes = node.scopes;

      for (const aScope of aScopes) {
        for (const bScope of bScopes) {
          if (aScope === bScope) return aScope;
        }
      }

      throw new Error(
        `Nodes do not share common ancestor: ${String(this)} ^ ${String(node)}`
      );
    }

    /**
     * Return this construct and all of its sub-nodes in the given order.
     *
     * Optionally filter nodes based on predicate.
     */
    findAll(options?: IFindNodeOptions): Node[] {
      const { predicate, order = ConstructOrder.PREORDER } = options || {};

      const all = new Array<Node>();

      function visit(c: Node) {
        if (order === ConstructOrder.PREORDER && !RootNode.isRootNode(c)) {
          all.push(c);
        }

        for (const child of c.children) {
          visit(child);
        }

        if (order === ConstructOrder.POSTORDER && !RootNode.isRootNode(c)) {
          all.push(c);
        }
      }

      visit(this);

      if (predicate) {
        return all.filter(predicate);
      }

      return all;
    }

    /** Recursively find the nearest sub-node matching predicate */
    find(predicate: INodePredicate): Node | undefined {
      if (predicate(this)) return this;

      for (const child of this.children) {
        const node = child.find(predicate);
        if (node != null) return node;
      }

      return undefined;
    }

    /**
     * Get *child* node with given *id*.
     *
     * @throws Error if no child with given id
     */
    getChild(id: string): Node {
      const child = this._children.get(id);

      if (child == null) {
        throw new Error(`${String(this)} does not have child with id "${id}"`);
      }

      return child;
    }

    /** Find child with given *id*. Similar to `find` but does not throw error if no child found. */
    findChild(id: string): Node | undefined {
      return this._children.get(id);
    }

    /**
     * Return all direct links of this node and that of all sub-nodes.
     *
     * Optionally filter links based on predicate.
     */
    findAllLinks(options?: IFindEdgeOptions): Edge[] {
      const {
        predicate,
        order = ConstructOrder.PREORDER,
        reverse,
      } = options || {};

      const all = new Array<Edge>();
      visit(this);

      if (predicate) {
        return all.filter(predicate);
      }

      return all;

      function visit(c: Node) {
        if (order === ConstructOrder.PREORDER) {
          all.push(...c[reverse ? "reverseLinks" : "links"]);
        }

        for (const child of c.children) {
          visit(child);
        }

        if (order === ConstructOrder.POSTORDER) {
          all.push(...c[reverse ? "reverseLinks" : "links"]);
        }
      }
    }

    /**
     * Resolve all link chains
     * @see {@link EdgeChain}
     */
    getLinkChains(reverse: boolean = false): EdgeChain[] {
      let links = this[reverse ? "reverseLinks" : "links"];
      return links.map((link): EdgeChain => {
        if (Reference.isReference(link)) {
          return (link as Reference).resolveChain();
        }
        return [link];
      });
    }

    /**
     * Find link of this node based on predicate. By default this will follow link
     * chains to evaluate the predicate against and return the matching direct link
     * of this node.
     *
     * @param predicate Edge predicate function to match edge
     * @param reverse Indicates if links are search in reverse order
     * @param follow Indicates if link chain is followed
     * @param direct Indicates that only *direct* links should be searched
     * @returns
     */
    findLink(
      predicate: IEdgePredicate,
      reverse: boolean = false,
      follow: boolean = true,
      direct: boolean = true
    ): Edge | undefined {
      if (follow) {
        const chains = this.getLinkChains(reverse);
        for (const chain of chains) {
          const edge = Edge.findInChain(chain, predicate);
          if (edge) {
            if (direct) return chain[0];
            return edge;
          }
        }
        return undefined;
      }

      return this[reverse ? "reverseLinks" : "links"].find(predicate);
    }

    /**
     * Find all links of this node based on predicate. By default this will follow link
     * chains to evaluate the predicate against and return the matching direct links
     * of this node.
     *
     * @param predicate Edge predicate function to match edge
     * @param reverse Indicates if links are search in reverse order
     * @param follow Indicates if link chain is followed
     * @param direct Indicates that only *direct* links should be searched
     * @returns
     */
    findLinks(
      predicate: IEdgePredicate,
      reverse: boolean = false,
      follow: boolean = true,
      direct: boolean = true
    ): Edge[] {
      if (follow) {
        return this.getLinkChains(reverse).flatMap((chain) => {
          const edges = Edge.findAllInChain(chain, predicate);
          if (direct) {
            return edges.length ? [chain[0]] : [];
          }
          return edges;
        });
      }

      return this[reverse ? "reverseLinks" : "links"].filter(predicate);
    }

    /** Indicates if *this node* references *another node* */
    doesReference(node: Node): boolean {
      return this.references.includes(node);
    }

    /** Indicates if *this node* depends on *another node* */
    doesDependOn(node: Node): boolean {
      return this.dependencies.includes(node);
    }

    /**
     * Indicates if this node allows destructive mutations
     * @see {@link Store.allowDestructiveMutations}
     */
    get allowDestructiveMutations(): boolean {
      return this.store.allowDestructiveMutations;
    }

    /**
     * Collapses all sub-nodes of *this node* into *this node*.
     * @destructive
     */
    mutateCollapse(): void {
      this._preMutate();

      this.children.forEach((child) => child.mutateCollapseToParent());

      this._mutateReconcileLinks();
    }

    /**
     * Collapses *this node* into *it's parent node*
     * @destructive
     */
    mutateCollapseToParent(): Node {
      this._preMutate();

      if (this.parent == null) {
        throw new Error(`${this} does not have parent to collapse to.`);
      }

      return this.mutateCollapseTo(this.parent);
    }

    /**
     * Collapses *this node* into *an ancestor*
     * @destructive
     */
    mutateCollapseTo(ancestor: Node): Node {
      this._preMutate();

      if (!this.isAncestor(ancestor)) {
        throw new Error(`${ancestor} is not an ancestor of ${this}`);
      }

      // TODO: should we retain the child attributes somewhere?

      this.children.forEach((child) => {
        if (child.isDestroyed) return;
        child.mutateCollapseToParent();
      });

      // redirect all links to parent
      // while also deleting links to parent
      this.links.forEach((link) => {
        if (link.isDestroyed) return;
        if (link.target === ancestor) {
          link.mutateDestroy();
        } else {
          link.mutateSource(ancestor);
        }
      });

      // redirect all "reverse" links to parent
      // while also deleting links from parent
      this.reverseLinks.forEach((link) => {
        if (link.isDestroyed) return;
        if (link.source === ancestor) {
          link.mutateDestroy();
        } else {
          link.mutateTarget(ancestor);
        }
      });

      this.mutateDestroy(true);

      ancestor._mutateReconcileLinks();

      return ancestor;
    }

    /**
     * Destroys this node by removing all references and removing this node from the store.
     * @param {boolean} [strict=false] - Indicates that this node must not have references
     * @destructive
     */
    mutateDestroy(strict: boolean = false): void {
      this._preMutate();

      if (strict) {
        if (this.children.length) {
          throw new Error(
            `[strict] ${this} can not destroys because it has children`
          );
        }
        if (this.links.length || this.reverseLinks.length) {
          throw new Error(
            `[strict] ${this} can not destroys because there are links referencing it`
          );
        }
      }

      if (strict && (this.links.length || this.reverseLinks.length)) {
        throw new Error(
          `[strict] ${this} can not destroys because there are links referencing it`
        );
      }

      this.children.forEach((child) => {
        child.mutateDestroy();
      });

      this.links.forEach((link) => {
        link.mutateDestroy();
      });

      this.reverseLinks.forEach((link) => {
        link.mutateDestroy();
      });

      if (this.parent) {
        this.parent.mutateRemoveChild(this);
      }

      this._parent = undefined;
      this._stack = undefined;

      this.store.mutateRemoveNode(this);
      this._destroyed = true;
    }

    /**
     * Reconciles links defined by this node. During mutations, multiple *equivalent* links may exist and should be
     * consolidated into a single link. This operation should be called after collapsing children to remove duplicates.
     * @internal
     * @destructive
     */
    protected _mutateReconcileLinks(): void {
      this._preMutate();

      const links = this.links;
      for (const a of links) {
        if (a.isDestroyed) continue;
        for (const b of links) {
          if (a === b || b.isDestroyed) continue;
          if (a.isEquivalent(b)) {
            a.mutateConsume(b);
          }
        }
      }

      const reverseLinks = this.reverseLinks;
      for (const a of reverseLinks) {
        if (a.isDestroyed) continue;
        for (const b of reverseLinks) {
          if (a === b || b.isDestroyed) continue;
          if (a.isEquivalent(b)) {
            a.mutateConsume(b);
          }
        }
      }
    }

    /**
     * Remove a *child* node from *this node*
     * @destructive
     */
    mutateRemoveChild(node: Node): boolean {
      this._preMutate();

      if (!this.isChild(node)) {
        throw new Error(`${node} is not a child of ${this}`);
      }

      // NB: children are stored by "id" not "uuid"
      return this._children.delete(node.id);
    }

    /**
     * Remove a *link* from *this node*
     * @destructive
     */
    mutateRemoveLink(link: Edge): boolean {
      this._preMutate();

      return this._links.delete(link.uuid);
    }

    /**
     * Remove a *link* to *this node*
     * @destructive
     */
    mutateRemoveReverseLink(link: Edge): boolean {
      this._preMutate();

      return this._reverseLinks.delete(link.uuid);
    }

    /**
     * Hoist *this node* to an *ancestor* by removing it from its current parent node and
     * in turn moving it to the ancestor.
     * @destructive
     */
    mutateHoist(newParent: Node): void {
      this._preMutate();

      if (!this.isAncestor(newParent)) {
        throw new Error(`${newParent} is not an ancestor of ${this}`);
      }

      if (this.parent) {
        this.parent.mutateRemoveChild(this);
      }

      this._parent = newParent;
      newParent.addChild(this);

      if (
        this.stack &&
        (this.stack as Node) !== this &&
        !this.isAncestor(this.stack)
      ) {
        this._stack = this.findAncestor(
          (node) =>
            StackNode.isStackNode(node) ||
            NestedStackNode.isNestedStackNode(node)
        ) as StackNode;
      }
    }

    /**
     * Hoist all children to parent and collapse node to parent.
     * @destructive
     */
    mutateUncluster(): void {
      this._preMutate();

      if (this.parent && !this.isLeaf) {
        for (const child of this.children) {
          child.mutateHoist(this.parent);
        }
        this.mutateCollapseToParent();
      }
    }

    /** Get string representation of this node */
    toString(): string {
      return `Node:${this.nodeType}::${this.uuid}`;
    }

    /**
     * Serialize this node
     * @internal
     */
    _serialize(): SerializedGraph.Node {
      return {
        ...super._serialize(),
        nodeType: this.nodeType,
        stack: this.stack?.uuid,
        parent: this.parent?.uuid,
        id: this.id,
        path: this.path,
        constructInfo: this.constructInfo,
        logicalId: this.logicalId,
        cfnType: this.cfnType,
        edges: this._links.size
          ? Array.from(this._links.values()).map(({ uuid }) => uuid)
          : undefined,
        children: this._children.size
          ? Object.fromEntries(
              Array.from(this._children.entries()).map(([key, node]) => [
                key,
                node._serialize(),
              ])
            )
          : undefined,
      };
    }
  }

  /** ResourceNode props */
  export interface IResourceNodeProps extends ITypedNodeProps {
    /** Type of node */
    nodeType?: NodeTypeEnum;
    /** Indicates if this resource is owned by cdk (defined in cdk library) */
    cdkOwned: boolean;
  }

  /** ResourceNode class defines a L2 cdk resource construct */
  export class ResourceNode extends Node {
    /** Attribute key for cfn resource type */
    static readonly ATT_WRAPPED_CFN_TYPE = "graph:resource:cfn-type";
    /** Attribute key for cfn properties */
    static readonly ATT_WRAPPED_CFN_PROPS = "graph:resource:cfn-props";

    /** Indicates if node is a {@link ResourceNode} */
    static isResourceNode(node: Node): node is ResourceNode {
      return node.nodeType === NodeTypeEnum.RESOURCE;
    }

    /** @internal */
    private _cfnResource: CfnResourceNode | null | undefined;

    constructor(props: IResourceNodeProps) {
      super({
        nodeType: NodeTypeEnum.RESOURCE,
        ...props,
      });

      if (props.cdkOwned) {
        this.addFlag(FlagEnum.CDK_OWNED);
      }
    }

    /** Get the CloudFormation resource type for this L2 resource or for the L1 resource is wraps. */
    get cfnType(): string | undefined {
      return (
        super.cfnType ||
        this.getAttribute(ResourceNode.ATT_WRAPPED_CFN_TYPE) ||
        this.cfnResource?.cfnType
      );
    }

    /** Indicates if this resource is owned by cdk (defined in cdk library) */
    get isCdkOwned(): boolean {
      return this.hasFlag(FlagEnum.CDK_OWNED);
    }

    /** Get the L1 cdk resource that this L2 resource wraps */
    get cfnResource(): CfnResourceNode | undefined {
      if (this._cfnResource !== undefined) {
        if (this._cfnResource && this._cfnResource.isDestroyed)
          return undefined;
        return this._cfnResource || undefined;
      }

      const resourceNode = this.findChild(CdkConstructIds.RESOURCE) as
        | CfnResourceNode
        | undefined;
      if (resourceNode) {
        this._cfnResource = resourceNode;
        return resourceNode;
      }
      const defaultNode = this.findChild(CdkConstructIds.DEFAULT) as
        | CfnResourceNode
        | undefined;
      if (defaultNode) {
        this._cfnResource = defaultNode;
        return defaultNode;
      }

      const childCfnResources = this.children.filter((node) => {
        return (
          CfnResourceNode.isCfnResourceNode(node) && node.isEquivalentFqn(this)
        );
      }) as CfnResourceNode[];
      if (childCfnResources.length === 1) {
        this._cfnResource = childCfnResources[0];
        return childCfnResources[0];
      }

      // prevent looking up again by setting to `null`
      this._cfnResource = null;

      return undefined;
    }

    /** Get the cfn properties from the L1 resource that this L2 resource wraps */
    get cfnProps(): SerializedGraph.PlainObject | undefined {
      if (this.cfnResource) {
        return this.cfnResource.cfnProps;
      }

      return this.getAttribute(ResourceNode.ATT_WRAPPED_CFN_PROPS);
    }

    /**
     * Modifies the L1 resource wrapped by this L2 resource
     * @param cfnResource
     * @destructive
     */
    mutateCfnResource(cfnResource?: CfnResourceNode): void {
      this._preMutate();

      this._cfnResource = cfnResource || null;
    }

    /** @inheritdoc */
    mutateRemoveChild(node: Node): boolean {
      if (this._cfnResource === node) {
        this.mutateCfnResource(undefined);
      }
      return super.mutateRemoveChild(node);
    }
  }

  /** CfnResourceNode props */
  export interface ICfnResourceNodeProps extends ITypedNodeProps {
    nodeType?: NodeTypeEnum;
  }

  /** CfnResourceNode defines an L1 cdk resource */
  export class CfnResourceNode extends Node {
    /** Indicates if a node is a {@link CfnResourceNode} */
    static isCfnResourceNode(node: Node): node is CfnResourceNode {
      return node.nodeType === NodeTypeEnum.CFN_RESOURCE;
    }

    constructor(props: ICfnResourceNodeProps) {
      super({
        nodeType: NodeTypeEnum.CFN_RESOURCE,
        ...props,
      });

      if (this.cfnType == null) {
        throw new Error("CfnResourceNode requires `cfnType` property");
      }
    }

    /**
     * Evaluates if CfnResourceNode fqn is equivalent to ResourceNode fqn.
     * @example `aws-cdk-lib.aws_lambda.Function` => `aws-cdk-lib.aws_lambda.CfnFunction`
     * @param resource - {@link Graph.ResourceNode} to compare
     * @returns Returns `true` if equivalent, otherwise `false`
     */
    isEquivalentFqn(resource: Graph.ResourceNode): boolean {
      const resourceFqnStub = resource.constructInfoFqn
        ?.split(".")
        .pop()
        ?.toLowerCase();
      const cfnResourceFqnStub = this.constructInfoFqn
        ?.split(".")
        .pop()
        ?.toLowerCase();
      if (!resourceFqnStub || !cfnResourceFqnStub) {
        return false;
      }
      return `cfn${resourceFqnStub}` === cfnResourceFqnStub;
    }

    /**
     * Finds the near *ancestor* that is a {@link ResourceNode}
     */
    findNearestResource(): ResourceNode | undefined {
      return this.scopes
        .slice()
        .reverse()
        .find((scope) => ResourceNode.isResourceNode(scope)) as
        | ResourceNode
        | undefined;
    }

    /**
     * @inheritdoc
     */
    mutateDestroy(strict?: boolean): void {
      const resource = this.findNearestResource();
      if (resource?.cfnResource === this) {
        resource.setAttribute(ResourceNode.ATT_WRAPPED_CFN_TYPE, this.cfnType);
        resource.setAttribute(
          ResourceNode.ATT_WRAPPED_CFN_PROPS,
          this.cfnProps
        );
        resource.mutateCfnResource(undefined);
      }

      super.mutateDestroy(strict);
    }
  }

  /** OutputNode props */
  export interface IOutputNodeProps extends ITypedNodeProps {
    /** Resolved output value */
    readonly value: any;
    /** Export name */
    readonly exportName?: string;
    /** Description */
    readonly description?: string;
  }

  /** OutputNode defines a cdk CfnOutput resources */
  export class OutputNode extends Node {
    /** Attribute key where output value is stored */
    static readonly ATTR_VALUE = "graph:output:value";
    /** Attribute key where output export name is stored */
    static readonly ATTR_EXPORT_NAME = "graph:output:export-name";

    /** Indicates if node is an {@link OutputNode} */
    static isOutputNode(node: Node): node is OutputNode {
      return node.nodeType === NodeTypeEnum.OUTPUT;
    }

    /** Indicates if {@link OutputNode} is **exported** */
    readonly isExport: boolean = false;

    constructor(props: IOutputNodeProps) {
      super({
        ...props,
        nodeType: NodeTypeEnum.OUTPUT,
      });

      if (this.stack == null) {
        throw new Error(`OutputNode instantiated outside of stack: ${this}`);
      }

      this.addFlag(FlagEnum.EXTRANEOUS);

      this.setAttribute(OutputNode.ATTR_VALUE, props.value);

      if (props.exportName) {
        this.isExport = true;
        this.setAttribute(OutputNode.ATTR_EXPORT_NAME, props.exportName);
      }

      props.description && this.setAttribute("description", props.description);

      this.stack.addOutput(this);
    }

    /** Get the *value** attribute */
    get value(): any {
      return this.getAttribute(OutputNode.ATTR_VALUE);
    }

    /** Get the export name attribute */
    get exportName(): string | undefined {
      return this.getAttribute(OutputNode.ATTR_EXPORT_NAME);
    }

    /** @inheritdoc */
    mutateDestroy(strict?: boolean): void {
      super.mutateDestroy(strict);

      this.stack?.mutateRemoveOutput(this);
    }
  }

  /** {@link ParameterNode} props */
  export interface IParameterNodeProps extends ITypedNodeProps {
    /** Resolved value */
    readonly value: any;
    /** Parameter type */
    readonly parameterType: string;
    /** Description */
    readonly description?: string;
  }

  /** ParameterNode defines a CfnParameter node */
  export class ParameterNode extends Node {
    /** Attribute key where parameter value is store */
    static readonly ATTR_VALUE = "graph:parameter:value";
    /** Attribute key where parameter type is stored */
    static readonly ATTR_TYPE = "graph:parameter:type";

    /** Indicates if node is a {@link ParameterNode} */
    static isParameterNode(node: Node): node is ParameterNode {
      return node.nodeType === NodeTypeEnum.PARAMETER;
    }

    /** Indicates if parameter is a reference to a stack */
    readonly isStackReference: boolean;

    constructor(props: IParameterNodeProps) {
      super({
        ...props,
        nodeType: NodeTypeEnum.PARAMETER,
      });

      if (this.stack == null) {
        throw new Error(`ParameterNode instantiated outside of stack: ${this}`);
      }

      this.addFlag(FlagEnum.EXTRANEOUS);

      this.setAttribute(ParameterNode.ATTR_VALUE, props.value);
      this.setAttribute(ParameterNode.ATTR_TYPE, props.parameterType);
      props.description && this.setAttribute("description", props.description);

      this.isStackReference = this.id.startsWith("reference-to-");

      this.stack.addParameter(this);
    }

    /** Get the value attribute */
    get value(): any {
      return this.getAttribute(ParameterNode.ATTR_VALUE);
    }

    /** Get the parameter type attribute */
    get parameterType(): any {
      return this.getAttribute(ParameterNode.ATTR_TYPE);
    }

    /** @inheritdoc */
    mutateDestroy(strict?: boolean): void {
      super.mutateDestroy(strict);

      this.stack?.mutateRemoveParameter(this);
    }
  }

  /** {@link StackNode} props */
  export interface IStackNodeProps extends ITypedNodeProps {
    /** Type of node */
    nodeType?: NodeTypeEnum.NESTED_STACK;
  }

  /** StackNode defines a cdk Stack */
  export class StackNode extends Node {
    /** Indicates if node is a {@link StackNode} */
    static isStackNode(node: Node): node is StackNode {
      return node.nodeType === NodeTypeEnum.STACK;
    }

    /**
     * Gets the {@link StackNode} containing a given resource
     * @throws Error is node is not contained in a stack
     */
    static of(node: Node): StackNode {
      const stack = node.stack;
      if (stack == null) {
        throw new Error(`${String(node)} is not within StackNode`);
      }
      return stack;
    }

    /** @internal */
    private readonly _outputs: Set<OutputNode> = new Set();
    /** @internal */
    private readonly _parameters: Set<ParameterNode> = new Set();
    /** @internal */
    private _stage?: StageNode;

    /** Get {@link StageNode} containing this stack */
    get stage(): StageNode | undefined {
      return this._stage;
    }

    /** Get all {@link OutputNode}s defined by this stack */
    get outputs(): OutputNode[] {
      return Array.from(this._outputs);
    }

    /** Get all {@link ParameterNode}s defined by this stack */
    get parameters(): ParameterNode[] {
      return Array.from(this._parameters);
    }

    constructor(props: IStackNodeProps) {
      super({
        nodeType: NodeTypeEnum.STACK,
        ...props,
      });

      if (this.stack !== this) {
        throw new Error(`Stack.stack is not self: ${this.uuid}`);
      }

      this.addFlag(FlagEnum.CLUSTER);

      this.store.addStack(this);

      const stage = this.findAncestor(StageNode.isStageNode) as StageNode;
      if (stage) {
        this._stage = stage;
        stage.addStack(this);
      }
    }

    /** Get all **exported** {@link OutputNode}s defined by this stack */
    get exports(): OutputNode[] {
      return this.outputs.filter((node) => node.isExport);
    }

    /** Associate {@link OutputNode} with this stack */
    addOutput(node: OutputNode): void {
      this._outputs.add(node);
    }

    /**
     * Find {@link OutputNode} with *logicalId* defined by this stack
     * @throws Error is no output found matching *logicalId*
     */
    findOutput(logicalId: string): OutputNode {
      const output = this.outputs.find(
        (_output) => _output.logicalId === logicalId
      );
      if (output == null) {
        console.debug(
          `${this}.Outputs: [logicalId]`,
          this.outputs.map((n) => n.logicalId)
        );
        throw new Error(`Output ${logicalId} does not exist in ${this}`);
      }
      return output;
    }

    /** Associate {@link ParameterNode} with this stack */
    addParameter(node: ParameterNode): void {
      this._parameters.add(node);
    }

    /**
     * Find {@link ParameterNode} with *parameterId* defined by this stack
     * @throws Error is no parameter found matching *parameterId*
     */
    findParameter(parameterId: string): ParameterNode {
      const parameter = this.parameters.find(
        (_parameter) => _parameter.id === parameterId
      );
      if (parameter == null) {
        console.debug(
          `${this}.Parameters: [id]`,
          this.parameters.map((n) => n.id)
        );
        throw new Error(`Parameter ${parameterId} does not exist in ${this}`);
      }
      return parameter;
    }

    /**
     * Disassociate {@link OutputNode} from this stack
     * @destructive
     */
    mutateRemoveOutput(node: OutputNode): boolean {
      this._preMutate();

      return this._outputs.delete(node);
    }

    /**
     * Disassociate {@link ParameterNode} from this stack
     * @destructive
     */
    mutateRemoveParameter(node: ParameterNode): boolean {
      this._preMutate();

      return this._parameters.delete(node);
    }

    /** @inheritdoc */
    mutateDestroy(strict?: boolean): void {
      super.mutateDestroy(strict);

      this.stage?.mutateRemoveStack(this);
    }

    /** @inheritdoc */
    mutateHoist(newParent: Node): void {
      super.mutateHoist(newParent);

      if (this.stage && this.isAncestor(this.stage)) {
        this.stage.mutateRemoveStack(this);
        this._stage = this.findAncestor((node) =>
          StageNode.isStageNode(node)
        ) as StageNode;
        if (this._stage) {
          this._stage.addStack(this);
        }
      }
    }
  }

  /** {@link NestedStackNode} props */
  export interface INestedStackNodeProps extends IStackNodeProps {
    /** Parent stack */
    readonly parentStack: StackNode;
  }

  /** NestedStackNode defines a cdk NestedStack */
  export class NestedStackNode extends StackNode {
    /** Indicates if node is a {@link NestedStackNode} */
    static isNestedStackNode(node: Node): node is NestedStackNode {
      return node.nodeType === NodeTypeEnum.NESTED_STACK;
    }

    /** @internal */
    private _parentStack?: StackNode;

    /** Get parent stack of this nested stack */
    get parentStack(): StackNode | undefined {
      return this._parentStack;
    }

    constructor(props: INestedStackNodeProps) {
      super({
        ...props,
        nodeType: NodeTypeEnum.NESTED_STACK,
      });

      this._parentStack = props.parentStack;
    }

    /** @inheritdoc */
    mutateHoist(newParent: Node): void {
      super.mutateHoist(newParent);

      if (this.parentStack && this.isAncestor(this.parentStack)) {
        this._parentStack = this.findAncestor((node) =>
          StackNode.isStackNode(node)
        ) as StackNode;
      }
    }
  }

  /** StageNode defines a cdk Stage */
  export class StageNode extends Node {
    /** Indicates if node is a {@link StageNode} */
    static isStageNode(node: Node): node is StageNode {
      return node.nodeType === NodeTypeEnum.STAGE;
    }

    /**
     * Gets the {@link StageNode} containing a given resource
     * @throws Error is node is not contained in a stage
     */
    static of(node: Node): StageNode {
      const stage = node.rootStack?.stage;
      if (stage == null) {
        throw new Error(`${node} is not within a stage`);
      }
      return stage;
    }

    /** @internal */
    private readonly _stacks: Set<StackNode> = new Set();

    /** Gets all stacks contained by this stage */
    get stacks(): StackNode[] {
      return Array.from(this._stacks);
    }

    constructor(props: ITypedNodeProps) {
      super({
        ...props,
        nodeType: NodeTypeEnum.STAGE,
      });

      this.store.addStage(this);

      this.addFlag(FlagEnum.CLUSTER);
    }

    /** Associate a {@link StackNode} with this stage */
    addStack(stack: StackNode): void {
      this._stacks.add(stack);
    }

    /**
     * Disassociate {@link StackNode} from this stage
     * @destructive
     */
    mutateRemoveStack(stack: StackNode): boolean {
      this._preMutate();

      return this._stacks.delete(stack);
    }
  }

  /** {@link AppNode} props */
  export interface IAppNodeProps extends IBaseEntityDataProps {
    /** Store */
    readonly store: Store;
    /** Parent node */
    readonly parent?: Node;
    /** Synthesized construct information defining jii resolution data */
    readonly constructInfo?: ConstructInfo;
    /** Logical id of the node, which is only unique within containing stack */
    readonly logicalId?: string;
    /** Type of CloudFormation resource */
    readonly cfnType?: string;
  }

  /** AppNode defines a cdk App */
  export class AppNode extends Node {
    /** Fixed UUID for App node */
    static readonly UUID = "App";
    /** Fixed path of the App  */
    static readonly PATH = "/";

    /** Indicates if node is a {@link AppNode} */
    static isAppNode(node: Node): node is AppNode {
      return node.nodeType === NodeTypeEnum.APP;
    }

    constructor(props: IAppNodeProps) {
      super({
        ...props,
        nodeType: NodeTypeEnum.APP,
        uuid: AppNode.UUID,
        id: AppNode.UUID,
        path: AppNode.PATH,
      });

      this.addFlag(FlagEnum.GRAPH_CONTAINER);
      this.addFlag(FlagEnum.CLUSTER);
    }
  }

  /** RootNode represents the root of the store tree */
  export class RootNode extends Node {
    /** Fixed UUID of root */
    static readonly UUID = "Root";
    /** Fixed path of root */
    static readonly PATH = "";

    /** Indicates if node is a {@link RootNode} */
    static isRootNode(node: Node): node is RootNode {
      return node.nodeType === NodeTypeEnum.ROOT;
    }

    constructor(store: Store) {
      super({
        store,
        nodeType: NodeTypeEnum.ROOT,
        uuid: RootNode.UUID,
        id: RootNode.UUID,
        path: RootNode.PATH,
      });

      this.addFlag(FlagEnum.GRAPH_CONTAINER);
      this.addFlag(FlagEnum.CLUSTER);
    }

    /**
     * @inheritdoc **The root not is excluded from list**
     */
    findAll(options?: IFindNodeOptions | undefined): Node[] {
      return super.findAll(options);
    }

    /**
     * > {@link RootNode} does not support this mutation
     * @throws Error does not support
     * @inheritdoc
     */
    mutateCollapse(): void {
      throw new Error("Root node can not be collapsed");
    }

    /**
     * > {@link RootNode} does not support this mutation
     * @throws Error does not support
     * @inheritdoc
     */
    mutateCollapseToParent(): Node {
      throw new Error("Root node can not be collapsed to parent");
    }

    /**
     * > {@link RootNode} does not support this mutation
     * @throws Error does not support
     * @inheritdoc
     */
    mutateCollapseTo(_ancestor: Node): Node {
      throw new Error("Root node can not be collapsed");
    }

    /**
     * > {@link RootNode} does not support this mutation
     * @throws Error does not support
     * @inheritdoc
     */
    mutateDestroy(_strict: boolean = false): void {
      throw new Error("Root node can not be destroyed");
    }

    /**
     * > {@link RootNode} does not support this mutation
     * @throws Error does not support
     * @inheritdoc
     */
    mutateHoist(_newParent: Node): void {
      throw new Error("Root node can not be hoisted");
    }
  }
}

/**
 * Deserializes a *serialized store object* into an *in-memory store instance**.
 * @param serializedStore - The serialized store to deserialize
 * @param allowDestructiveMutations - Indicates if the store instance allows destructive mutations.
 * @throws Error if a serialized node's parent does not match visitor parent
 * @throws Error if a serialized node type deserialization mapping is not defined
 * @throws Error if edge type deserialization mapping is not defined
 */
export function deserializeStore(
  serializedStore: SerializedGraph.GraphStore,
  allowDestructiveMutations: boolean = false
): Graph.Store {
  const store = new Graph.Store(allowDestructiveMutations);

  // TODO: ensure store versions are compatible

  function visit(sNode: SerializedGraph.Node, parent: Graph.Node): void {
    const nodeProps: Graph.ITypedNodeProps = {
      ...(omit(sNode, [
        "children",
        "parent",
        "stack",
        "nodeType",
      ] as (keyof SerializedGraph.Node)[]) as Omit<
        SerializedGraph.Node,
        "children" | "parent" | "stack" | "nodeType"
      >),
      parent: sNode.parent ? store.getNode(sNode.parent) : undefined,
      // resolve stack node, unless stack is itself
      stack:
        sNode.stack && sNode.stack !== sNode.uuid
          ? store.getStack(sNode.stack)
          : undefined,
      store,
    };

    if (nodeProps.parent !== parent) {
      throw new Error(
        `SerializedNode parent ${sNode.parent} does not match visitor parent ${parent.uuid}`
      );
    }

    let node: Graph.Node | undefined = undefined;

    switch (sNode.nodeType) {
      case NodeTypeEnum.APP: {
        node = new Graph.AppNode({
          ...nodeProps,
          parent,
        });
        break;
      }
      case NodeTypeEnum.STAGE: {
        node = new Graph.StageNode(nodeProps);
        break;
      }
      case NodeTypeEnum.STACK: {
        node = new Graph.StackNode(nodeProps);
        break;
      }
      case NodeTypeEnum.NESTED_STACK: {
        node = new Graph.NestedStackNode({
          ...nodeProps,
          parentStack: Graph.StackNode.of(parent),
        });
        break;
      }
      case NodeTypeEnum.OUTPUT: {
        node = new Graph.OutputNode({
          ...nodeProps,
          value: nodeProps.attributes![Graph.OutputNode.ATTR_VALUE],
          exportName: nodeProps.attributes![
            Graph.OutputNode.ATTR_EXPORT_NAME
          ] as string,
          description: nodeProps.attributes!.description as string,
        });
        break;
      }
      case NodeTypeEnum.PARAMETER: {
        node = new Graph.ParameterNode({
          ...nodeProps,
          value: nodeProps.attributes![Graph.ParameterNode.ATTR_VALUE],
          parameterType: nodeProps.attributes![
            Graph.ParameterNode.ATTR_TYPE
          ] as string,
          description: nodeProps.attributes!.description as string,
        });
        break;
      }
      case NodeTypeEnum.CFN_RESOURCE: {
        node = new Graph.CfnResourceNode(nodeProps);
        break;
      }
      case NodeTypeEnum.RESOURCE: {
        node = new Graph.ResourceNode({
          ...nodeProps,
          cdkOwned: !!nodeProps.flags?.includes(FlagEnum.CDK_OWNED),
        });
        break;
      }
      case NodeTypeEnum.DEFAULT: {
        node = new Graph.Node({
          ...nodeProps,
          nodeType: NodeTypeEnum.DEFAULT,
        });
        break;
      }
    }

    if (node == null) {
      console.debug(sNode.nodeType, sNode);
      throw new Error(
        `NodeType ${sNode.nodeType} missing deserialization mapping`
      );
    }

    // ensure node is registered in store
    assert(
      store.getNode(sNode.uuid) === node,
      `Node ${sNode.uuid} did not register in store`
    );

    Object.values(sNode.children || {}).forEach((sChild) => {
      visit(sChild, node!);
    });
  }

  Object.values(serializedStore.tree.children || {}).forEach((sNode) => {
    visit(sNode, store.root);
  });

  serializedStore.edges.forEach((sEdge) => {
    const edgeProps: Graph.IEdgeProps = {
      ...sEdge,
      store,
      source: store.getNode(sEdge.source),
      target: store.getNode(sEdge.target),
    };

    switch (sEdge.edgeType) {
      case EdgeTypeEnum.DEPENDENCY: {
        new Graph.Dependency({
          ...edgeProps,
        });
        break;
      }
      case EdgeTypeEnum.REFERENCE: {
        const referenceType: ReferenceTypeEnum = sEdge.attributes![
          Graph.Reference.ATT_TYPE
        ] as ReferenceTypeEnum;
        if (referenceType === ReferenceTypeEnum.ATTRIBUTE) {
          new Graph.AttributeReference({
            ...edgeProps,
            value: sEdge.attributes![Graph.AttributeReference.ATT_VALUE]!,
          });
        } else if (referenceType === ReferenceTypeEnum.IMPORT) {
          new Graph.ImportReference({
            ...edgeProps,
          });
        } else if (referenceType === ReferenceTypeEnum.REF) {
          new Graph.Reference(edgeProps);
        } else {
          throw new Error(`Unsupported reference type of ${referenceType}`);
        }
        break;
      }
      default: {
        // TODO: support custom edge types explicitly
        new Graph.Edge(edgeProps);
      }
    }
  });

  return store;
}
