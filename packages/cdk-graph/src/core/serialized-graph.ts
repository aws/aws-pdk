/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { MetadataEntry as CdkMetadataEntry } from "constructs";
import {
  FlagEnum,
  UUID,
  NodeTypeEnum,
  LOGICAL_ID,
  EdgeDirectionEnum,
  EdgeTypeEnum,
  ReferenceTypeEnum,
  Version,
} from "./types";
import { ConstructInfo } from "../cdk-internals";

export type Primitive = string | boolean | number;

/**
 * Serializable plain object value (JSII supported)
 */
export interface PlainObject {
  /** @jsii ignore */
  readonly [key: string]: Value;
}

/** Serializable value, which is either a primitive or plain object (JSII supported) */
export type PValue = Primitive | PlainObject;

/** Serializable value or array of values (JSII supported) */
export type Value = PValue | PValue[];

/**
 * Serializable attributes mapping
 * @struct
 */
export type Attributes = {
  readonly [key: string]: Value;
};

/** Serializable metadata entry */
export type MetadataEntry = CdkMetadataEntry;

/** Serializable list of metadata entries */
export type Metadata = MetadataEntry[];

/**
 * Serializable dictionary of tags (key value pairs)
 * @struct
 */
export type Tags = {
  readonly [key: string]: string;
};

/**
 * Serializable graph entity
 * @struct
 */
export interface SGEntity {
  /** Universally unique identity */
  readonly uuid: UUID;

  /**
   * Serializable entity attributes
   * @see {@link Attributes}
   */
  readonly attributes?: Attributes;
  /**
   * Serializable entity metadata
   * @see {@link Metadata}
   */
  readonly metadata?: Metadata;
  /**
   * Serializable entity tags
   * @see {@link Tags}
   */
  readonly tags?: Tags;
  /**
   * Serializable entity flags
   * @see {@link FlagEnum}
   */
  readonly flags?: FlagEnum[];
}

/**
 * Serializable graph node entity
 * @struct
 */
export interface SGNode extends SGEntity {
  /** Node type */
  readonly nodeType: NodeTypeEnum;
  /** UUID of node stack */
  readonly stack?: UUID;
  /** UUID of node parent */
  readonly parent?: UUID;
  /** Node id within parent (unique only between parent child nodes) */
  readonly id: string;
  /** Node path */
  readonly path: string;
  /** Synthesized construct information defining jii resolution data */
  readonly constructInfo?: ConstructInfo;
  /** Logical id of the node, which is only unique within containing stack */
  readonly logicalId?: LOGICAL_ID;
  /** CloudFormation resource type for this node */
  readonly cfnType?: string;
  /** Child node record */
  readonly children?: Record<string, SGNode>;
  /** List of edge UUIDs where this node is the **source** */
  readonly edges?: UUID[];
}

/**
 * Serializable graph edge entity
 * @struct
 */
export interface SGEdge extends SGEntity {
  /** Type of edge */
  readonly edgeType: EdgeTypeEnum;
  /** Indicates the direction in which the edge is directed */
  readonly direction: EdgeDirectionEnum;
  /** UUID of edge **source**  node (tail) */
  readonly source: UUID;
  /** UUID of edge **target**  node (head) */
  readonly target: UUID;
}

/**
 * Serializable graph store
 * @struct
 */
export interface SGGraphStore {
  /** Store version */
  readonly version: Version;
  /** Node tree */
  readonly tree: SGNode;
  /** List of edges */
  readonly edges: SGEdge[];
}

/** Interface for serializable graph entities */
export interface ISerializableEntity {
  /** @internal */
  _serialize(): SGEntity;
}

/** Interface for serializable graph node entity */
export interface ISerializableNode {
  /** @internal */
  _serialize(): SGNode;
}

/** Interface for serializable graph edge entity */
export interface ISerializableEdge {
  /** @internal */
  _serialize(): SGEdge;
}

/** Interface for serializable graph store */
export interface ISerializableGraphStore {
  serialize(): SGGraphStore;
}

/** Unresolved reference struct. During graph computation references are unresolved and stored in this struct. */
export interface SGUnresolvedReference {
  readonly source: UUID;
  readonly referenceType: ReferenceTypeEnum;
  readonly target: string;
  readonly value?: Value;
}
