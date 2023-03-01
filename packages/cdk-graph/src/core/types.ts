/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { MetadataEntry as CdkMetadataEntry } from "constructs";
import { ConstructInfo } from "../cdk-internals";

/** Version string - should follow semantic versioning */
export type Version = string;

/** Common cdk construct ids */
export enum CdkConstructIds {
  DEFAULT = "Default",
  RESOURCE = "Resource",
  EXPORTS = "Exports",
}

/** Commonly used cdk construct info fqn (jsii fully-qualified ids) */
export enum ConstructInfoFqnEnum {
  APP = "aws-cdk-lib.App",
  PDKAPP_MONO = "aws-prototyping-sdk.PDKNagApp",
  PDKAPP = "@aws-prototyping-sdk/pdk-nag.PDKNagApp",
  STAGE = "aws-cdk-lib.Stage",
  STACK = "aws-cdk-lib.Stack",
  NESTED_STACK = "aws-cdk-lib.NestedStack",
  CFN_STACK = "aws-cdk-lib.CfnStack",
  CFN_OUTPUT = "aws-cdk-lib.CfnOutput",
  CFN_PARAMETER = "aws-cdk-lib.CfnParameter",
  // Custom Resources
  CUSTOM_RESOURCE = "aws-cdk-lib.CustomResource",
  AWS_CUSTOM_RESOURCE = "aws-cdk-lib.custom_resources.AwsCustomResource",
  CUSTOM_RESOURCE_PROVIDER = "aws-cdk-lib.custom_resources.Provider",
  CUSTOM_RESOURCE_PROVIDER_2 = "aws-cdk-lib.CustomResourceProvider",
  // Lambda
  LAMBDA = "aws-cdk-lib.aws_lambda.Function",
  CFN_LAMBDA = "aws-cdk-lib.aws_lambda.CfnFunction",
  LAMBDA_LAYER_VERSION = "aws-cdk-lib.aws_lambda.LayerVersion",
  CFN_LAMBDA_LAYER_VERSION = "aws-cdk-lib.aws_lambda.CfnLayerVersion",
  LAMBDA_ALIAS = "aws-cdk-lib.aws_lambda.Alias",
  CFN_LAMBDA_ALIAS = "aws-cdk-lib.aws_lambda.CfnAlias",
  LAMBDA_BASE = "aws-cdk-lib.aws_lambda.FunctionBase",
  // Assets
  ASSET_STAGING = "aws-cdk-lib.AssetStaging",
  S3_ASSET = "aws-cdk-lib.aws_s3_assets.Asset",
  ECR_TARBALL_ASSET = "aws-cdk-lib.aws_ecr_assets.TarballImageAsset",
  // EC2
  EC2_INSTANCE = "aws-cdk-lib.aws_ec2.Instance",
  CFN_EC2_INSTANCE = "aws-cdk-lib.aws_ec2.CfnInstance",
  SECURITY_GROUP = "aws-cdk-lib.aws_ec2.SecurityGroup",
  CFN_SECURITY_GROUP = "aws-cdk-lib.aws_ec2.CfnSecurityGroup",
  VPC = "aws-cdk-lib.aws_ec2.Vpc",
  CFN_VPC = "aws-cdk-lib.aws_ec2.CfnVpc",
  PRIVATE_SUBNET = "aws-cdk-lib.aws_ec2.PrivateSubnet",
  CFN_PRIVATE_SUBNET = "aws-cdk-lib.aws_ec2.CfnPrivateSubnet",
  PUBLIC_SUBNET = "aws-cdk-lib.aws_ec2.PublicSubnet",
  CFN_PUBLIC_SUBNET = "aws-cdk-lib.aws_ec2.CfnPublicSubnet",
}

/** Fqns that denote a cdk asset */
export const AssetFqns = [
  ConstructInfoFqnEnum.S3_ASSET,
  ConstructInfoFqnEnum.ECR_TARBALL_ASSET,
];

/** Fqns considered extraneous */
export const ExtraneousFqns = [
  ...AssetFqns,
  ConstructInfoFqnEnum.ASSET_STAGING,
  ConstructInfoFqnEnum.LAMBDA_LAYER_VERSION,
  ConstructInfoFqnEnum.CFN_LAMBDA_LAYER_VERSION,
  ConstructInfoFqnEnum.LAMBDA_ALIAS,
  ConstructInfoFqnEnum.CFN_LAMBDA_ALIAS,
  ConstructInfoFqnEnum.LAMBDA_BASE,
];

/** Fqns that denote CDK CustomResources */
export const CustomResourceFqns = [
  ConstructInfoFqnEnum.CUSTOM_RESOURCE,
  ConstructInfoFqnEnum.AWS_CUSTOM_RESOURCE,
  ConstructInfoFqnEnum.CUSTOM_RESOURCE_PROVIDER,
  ConstructInfoFqnEnum.CUSTOM_RESOURCE_PROVIDER_2,
];

/** Common cfn attribute keys */
export enum CfnAttributesEnum {
  TYPE = "aws:cdk:cloudformation:type",
  PROPS = "aws:cdk:cloudformation:props",
}

/** Common cdk metadata types */
export enum MetadataTypeEnum {
  LOGICAL_ID = "aws:cdk:logicalId",
}

/** Node types handled by the graph */
export enum NodeTypeEnum {
  /** Default node type - used for all nodes that don't have explicit type defined */
  DEFAULT = "DEFAULT",
  /** L1 cfn resource node */
  CFN_RESOURCE = "CFN_RESOURCE",
  /** L2 cdk resource node */
  RESOURCE = "RESOURCE",
  /** Cdk customer resource node */
  CUSTOM_RESOURCE = "CUSTOM_RESOURCE",
  /** Graph root node */
  ROOT = "ROOT",
  /** Cdk App node */
  APP = "APP",
  /** Cdk Stage node */
  STAGE = "STAGE",
  /** Cdk Stack node */
  STACK = "STACK",
  /** Cdk NestedStack node */
  NESTED_STACK = "NESTED_STACK",
  /** CfnOutput node */
  OUTPUT = "OUTPUT",
  /** CfnParameter node */
  PARAMETER = "PARAMETER",
  /** Cdk asset node */
  ASSET = "ASSET",
}

/** Edge types handles by the graph */
export enum EdgeTypeEnum {
  /** Custom edge */
  CUSTOM = "CUSTOM",
  /** Reference edge (Ref, Fn::GetAtt, Fn::ImportValue) */
  REFERENCE = "REFERENCE",
  /** CloudFormation dependency edge */
  DEPENDENCY = "DEPENDENCY",
}

/**
 * EdgeDirection specifies in which direction the edge is directed or if it is undirected.
 */
export enum EdgeDirectionEnum {
  /** Indicates that edge is *undirected*; meaning there is no directional relationship between the **source** and **target**. */
  NONE = "none",
  /** Indicates the edge is *directed* from the **source** to the **target** */
  FORWARD = "forward",
  /** Indicates the edge is *directed* from the **target** to the **source** */
  BACK = "back",
  /** Indicates the edge is *bi-directional* */
  BOTH = "both",
}

/** Reference edge types */
export enum ReferenceTypeEnum {
  /** CloudFormation **Ref** reference */
  REF = "Ref",
  /** CloudFormation **Fn::GetAtt** reference */
  ATTRIBUTE = "Fn::GetAtt",
  /** CloudFormation **Fn::ImportValue** reference */
  IMPORT = "Fn::ImportValue",
  /** CloudFormation **Fn::Join** reference of imported resourced (eg: `s3.Bucket.fromBucketArn()`) */
  IMPORT_ARN = "Fn::Join::arn",
}

/** Graph flags */
export enum FlagEnum {
  /** Indicates that node is a cluster (container) and treated like an emphasized subgraph. */
  CLUSTER = "CLUSTER",
  /** Indicates that node is non-resource container (Root, App) and used for structural purpose in the graph only. */
  GRAPH_CONTAINER = "GRAPH_CONTAINER",
  /** Indicates that the entity is extraneous and considered collapsible to parent without impact of intent. */
  EXTRANEOUS = "EXTRANEOUS",
  /** Indicates node is a simple CfnResource wrapper and can be collapsed without change of intent; Determined by only containing a single child of "Default" or "Resource" */
  RESOURCE_WRAPPER = "RESOURCE_WRAPPER",
  /** Indicates node is considered a CDK Asset (Lambda Code, Docker Image, etc). */
  ASSET = "ASSET",
  /** Indicates that node was created by CDK (`construct.node.defaultChild === CfnResource`). */
  CDK_OWNED = "CDK_OWNED",
  /** Indicates that edge is closed; meaning `source === target`. This flag only gets applied on creation of edge, not during mutations to maintain initial intent. */
  CLOSED_EDGE = "CLOSED_EDGE",
  /** Indicates that entity was mutated; meaning a mutation was performed to change originally computed graph value. */
  MUTATED = "MUTATED",
  /** Indicates that cfn resource has equivalent cdk resource wrapper. (eg: Lambda => CfnLambda) */
  WRAPPED_CFN_RESOURCE = "WRAPPED_CFN_RESOURCE",
  /** Indicates that resource is imported into CDK (eg: `lambda.Function.fromFunctionName()`, `s3.Bucket.fromBucketArn()`) */
  IMPORT = "IMPORT",
  /**
   * Indicates if node is a CustomResource
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources-readme.html
   */
  CUSTOM_RESOURCE = "CUSTOM_RESOURCE",
  /**
   * Indicates if node is an AwsCustomResource, which is a custom resource that simply calls
   * the AWS SDK API via singleton provider.
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources.AwsCustomResource.html
   */
  AWS_CUSTOM_RESOURCE = "AWS_CUSTOM_RESOURCE",
  /**
   * Indicates if lambda function resource is a singleton AWS API call lambda for AwsCustomResources.
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources.AwsCustomResource.html
   */
  AWS_API_CALL_LAMBDA = "AWS_API_CALL_LAMBDA",
}

/** Universal unique identifier */
export type UUID = string;
/** Stack scoped logical id - unique within parent stack */
export type LOGICAL_ID = string;
/** Universal logical id - unique within graph */
export type LOGICAL_UNIVERSAL_ID = string; // `${UUID}:${LOGICAL_ID}`;

/** Unresolved reference struct. During graph computation references are unresolved and stored in this struct. */
export interface UnresolvedReference {
  readonly source: UUID;
  readonly referenceType: ReferenceTypeEnum;
  readonly target: string;
  readonly value?: SerializedGraph.Value;
}

/** Serialized graph representation - what is stored in `graph.json` file and can be deserialized into store instance */
export namespace SerializedGraph {
  /** Serializable primitive values (JSII supported) */
  export type Primitive = string | boolean | number;

  /**
   * Serializable plain object value (JSII supported)
   * @struct
   */
  export interface PlainObject {
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
  export interface Attributes {
    // readonly [CfnAttributesEnum.TYPE]?: string;
    // readonly [CfnAttributesEnum.PROPS]?: PlainObject;
    readonly [key: string]: Value;
  }

  /** Serializable metadata entry */
  export type MetadataEntry = CdkMetadataEntry;

  /** Serializable list of metadata entries */
  export type Metadata = MetadataEntry[];

  /**
   * Serializable dictionary of tags (key value pairs)
   * @struct
   */
  export interface Tags {
    readonly [key: string]: string;
  }

  /**
   * Serializable graph entity
   * @struct
   */
  export interface Entity {
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
  export interface Node extends Entity {
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
    readonly children?: Record<string, Node>;
    /** List of edge UUIDs where this node is the **source** */
    readonly edges?: UUID[];
  }

  /**
   * Serializable graph edge entity
   * @struct
   */
  export interface Edge extends Entity {
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
  export interface GraphStore {
    /** Store version */
    readonly version: Version;
    /** Node tree */
    readonly tree: Node;
    /** List of edges */
    readonly edges: Edge[];
  }

  /** Interface for serializable graph entities */
  export interface ISerializableEntity {
    /** @internal */
    _serialize(): SerializedGraph.Entity;
  }

  /** Interface for serializable graph node entity */
  export interface ISerializableNode {
    /** @internal */
    _serialize(): SerializedGraph.Node;
  }

  /** Interface for serializable graph edge entity */
  export interface ISerializableEdge {
    /** @internal */
    _serialize(): SerializedGraph.Edge;
  }

  /** Interface for serializable graph store */
  export interface ISerializableGraphStore {
    serialize(): SerializedGraph.GraphStore;
  }
}
