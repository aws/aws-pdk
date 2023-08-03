/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

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
  LAMBDA_SINGLETON = "aws-cdk-lib.aws_lambda.SingletonFunction",
  LAMBDA_LAYER_AWSCLI = "aws-cdk-lib.lambda_layer_awscli.AwsCliLayer",
  CFN_LAMBDA_PERMISSIONS = "aws-cdk-lib.aws_lambda.CfnPermission",
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
  // IAM
  IAM_ROLE = "aws-cdk-lib.aws_iam.Role",
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
  ConstructInfoFqnEnum.LAMBDA_SINGLETON,
  ConstructInfoFqnEnum.LAMBDA_LAYER_AWSCLI,
  ConstructInfoFqnEnum.CFN_LAMBDA_PERMISSIONS,
];

/** Fqns that denote CDK CustomResources */
export const CustomResourceFqns = [
  ConstructInfoFqnEnum.CUSTOM_RESOURCE,
  ConstructInfoFqnEnum.AWS_CUSTOM_RESOURCE,
  ConstructInfoFqnEnum.CUSTOM_RESOURCE_PROVIDER,
  ConstructInfoFqnEnum.CUSTOM_RESOURCE_PROVIDER_2,
];

/**
 * Enum of specific Cfn Resource Types
 * @internal
 */
export enum CfnResourceTypes {
  CUSTOM_RESOURCE = "AWS::CloudFormation::CustomResource",
}

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
  /** Indicates node is considered a CDK Asset (Lambda Code, Docker Image, etc). */
  ASSET = "ASSET",
  /**
   * Indicates that node was created by CDK.
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Resource.html#static-iswbrownedwbrresourceconstruct
   */
  CDK_OWNED = "CDK_OWNED",
  /**
   * Indicates node ConstructInfoFqn denotes a `aws-cdk-lib.*.Cfn*` construct.
   */
  CFN_FQN = "CFN_FQN",
  /** Indicates that edge is closed; meaning `source === target`. This flag only gets applied on creation of edge, not during mutations to maintain initial intent. */
  CLOSED_EDGE = "CLOSED_EDGE",
  /** Indicates that entity was mutated; meaning a mutation was performed to change originally computed graph value. */
  MUTATED = "MUTATED",
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
