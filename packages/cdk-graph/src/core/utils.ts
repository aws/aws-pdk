/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  CfnElement,
  CfnResource,
  IInspectable,
  Names,
  Resource,
  Stack,
  TreeInspector,
} from "aws-cdk-lib";
import { Construct, IConstruct } from "constructs";
import cloneDeep = require("lodash.clonedeep"); // eslint-disable-line @typescript-eslint/no-require-imports
import shorthash = require("shorthash2"); // eslint-disable-line @typescript-eslint/no-require-imports
import traverse = require("traverse"); // eslint-disable-line @typescript-eslint/no-require-imports
import {
  AssetFqns,
  CdkConstructIds,
  CfnAttributesEnum,
  ConstructInfoFqnEnum,
  CustomResourceFqns,
  ExtraneousFqns,
  FlagEnum,
  MetadataTypeEnum,
  ReferenceTypeEnum,
  SerializedGraph,
  UnresolvedReference,
  UUID,
} from "./types";
import { ConstructInfo, constructInfoFromConstruct } from "../cdk-internals";

/**
 * Generate deterministic UUID based on given value and prefix.
 * @param value The value to hash as UUID
 * @param {string} [prefix=""] Optional prefix used to prevent value conflicts
 */
export function generateConsistentUUID(
  value: any,
  prefix: string = ""
): string {
  return prefix + shorthash(JSON.stringify(value));
}

/** Get UUID for a given construct */
export function getConstructUUID(construct: IConstruct): string {
  return Names.uniqueResourceName(construct, {});
}

/** Try to get *logicalId* for given construct */
export function tryGetLogicalId(construct: IConstruct): string | undefined {
  if (CfnElement.isCfnElement(construct)) {
    const stack = Stack.of(construct);
    return stack.resolve(stack.getLogicalId(construct));
  }
  return undefined;
}

/** Inferred node props */
export interface InferredNodeProps extends SerializedGraph.Entity {
  readonly logicalId?: string;
  readonly cfnType?: string;
  readonly constructInfo?: ConstructInfo;
  readonly dependencies: UUID[];
  readonly unresolvedReferences: UnresolvedReference[];
}

/** Infer node props from construct */
export function inferNodeProps(construct: Construct): InferredNodeProps {
  const uuid = getConstructUUID(construct);

  const logicalId = tryGetLogicalId(construct);

  const metadata: SerializedGraph.Metadata = construct.node.metadata.filter(
    (entry) => {
      if (entry.type === MetadataTypeEnum.LOGICAL_ID) return false;
      return true;
    }
  );

  const attributes: SerializedGraph.Attributes = cloneDeep(
    extractInspectableAttributes(construct) || {}
  );

  const cfnType = attributes[CfnAttributesEnum.TYPE] as string;
  if (cfnType) {
    // @ts-ignore
    delete attributes[CfnAttributesEnum.TYPE];
  }

  const cfnProps = attributes[CfnAttributesEnum.PROPS] || {};

  let tags: SerializedGraph.Tags = {};
  // normalize tags
  if (typeof cfnProps === "object" && "tags" in cfnProps) {
    const _tags = cfnProps.tags as CfnAttributesTags;

    // remove the tags from the attributes since we normalize
    // @ts-ignore
    delete cfnProps.tags;

    if (Array.isArray(_tags)) {
      tags = Object.fromEntries(_tags.map(({ key, value }) => [key, value]));
    } else {
      tags = _tags;
    }
  }

  const constructInfo = constructInfoFromConstruct(construct);

  const flags = inferFlags(construct, constructInfo);

  return {
    uuid,
    attributes,
    metadata,
    tags,
    logicalId,
    cfnType,
    constructInfo,
    dependencies: obtainDependencies(construct),
    unresolvedReferences: extractUnresolvedReferences(uuid, attributes),
    flags,
  };
}

function obtainDependencies(construct: Construct): string[] {
  if (CfnResource.isCfnResource(construct)) {
    return construct.obtainDependencies().map(getConstructUUID);
  }

  return construct.node.dependencies.map(getConstructUUID);
}

type CfnAttributesTags =
  | { key: string; value: string }[]
  | { [key: string]: string };

/** Extract inspectable attributes from construct */
export function extractInspectableAttributes(
  construct: IConstruct
): SerializedGraph.Attributes | undefined {
  // check if a construct implements IInspectable
  function canInspect(inspectable: any): inspectable is IInspectable {
    return inspectable.inspect !== undefined;
  }

  const inspector = new TreeInspector();

  // get attributes from the inspector
  if (canInspect(construct)) {
    construct.inspect(inspector);
    return Stack.of(construct).resolve(inspector.attributes);
  }
  return undefined;
}

/** Pattern of ignored references. Those which are resolved during deploy-time. */
export const IGNORE_REF_PATTERN = /^AWS::/;

/** Extract unresolved references from attributes for a given source */
export function extractUnresolvedReferences(
  source: UUID,
  from: SerializedGraph.Attributes
): UnresolvedReference[] {
  const references: UnresolvedReference[] = [];

  traverse(from).forEach(function (this: traverse.TraverseContext) {
    switch (this.key) {
      case ReferenceTypeEnum.ATTRIBUTE: {
        const [logicalId, attribute] = this.node as [string, string];
        references.push({
          source,
          referenceType: ReferenceTypeEnum.ATTRIBUTE,
          target: logicalId,
          value: attribute,
        });
        this.block();
        break;
      }
      case ReferenceTypeEnum.REF: {
        if (typeof this.node === "string") {
          if (!IGNORE_REF_PATTERN.test(this.node)) {
            references.push({
              source,
              referenceType: ReferenceTypeEnum.REF,
              target: this.node as string,
            });
          }
        } else {
          console.warn(`Found non-string "Ref"`, this.node);
        }
        this.block();
        break;
      }
      case ReferenceTypeEnum.IMPORT: {
        // "Fn::ImportValue": "Ada:ExportsOutputFnGetAttCommonStackA8F9EE77OutputsAdaCommonStackCounterTable5D6ADA16ArnED1AF27F"
        // "Fn::ImportValue": "Stage-Ada:ExportsOutputFnGetAttCommonStackA8F9EE77OutputsAdaCommonStackCounterTable5D6ADA16ArnED1AF27F"
        references.push({
          source,
          referenceType: ReferenceTypeEnum.IMPORT,
          // NB: remove stage - separator
          target: (this.node as string).replace("-", ""),
        });
        this.block();
        break;
      }
      case "Fn::Join": {
        if (
          Array.isArray(this.node) &&
          this.node.flatMap(String).join("").startsWith("arn:")
        ) {
          const potentialImportArn = {
            "Fn::Join": this.node,
          };
          references.push({
            source,
            referenceType: ReferenceTypeEnum.IMPORT_ARN,
            target: tokenizeImportArn(potentialImportArn),
          });
        }
        break;
      }
    }
  });

  return references;
}

// https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/custom-resources/lib/aws-custom-resource/aws-custom-resource.ts#L357
const AWS_PROVIDER_FUNCTION_UUID = "679f53fac002430cb0da5b7982bd2287";

/** Infer construct flags  */
export function inferFlags(
  construct: IConstruct,
  constructInfo?: ConstructInfo
): FlagEnum[] {
  const flags: Set<FlagEnum> = new Set();
  const fqn = constructInfo?.fqn;

  if (isImportConstruct(construct)) {
    flags.add(FlagEnum.IMPORT);
  } else {
    if (fqn && ExtraneousFqns.includes(fqn as any)) {
      flags.add(FlagEnum.EXTRANEOUS);
    }

    if (fqn && AssetFqns.includes(fqn as any)) {
      flags.add(FlagEnum.ASSET);
    }
  }

  if (construct.node.children.length === 1) {
    const onlyChild = construct.node.children[0];
    if (
      [CdkConstructIds.RESOURCE, CdkConstructIds.DEFAULT].includes(
        onlyChild.node.id as any
      )
    ) {
      flags.add(FlagEnum.RESOURCE_WRAPPER);
    }
  }

  if (construct.node.id === "Exports" && Stack.isStack(construct.node.scope)) {
    flags.add(FlagEnum.EXTRANEOUS);
  }

  if (construct.node.id.startsWith("SsmParameterValue:")) {
    flags.add(FlagEnum.EXTRANEOUS);
  }

  if (
    fqn === ConstructInfoFqnEnum.LAMBDA &&
    Resource.isOwnedResource(construct)
  ) {
    if (construct.node.id === `AWS${AWS_PROVIDER_FUNCTION_UUID}`) {
      flags.add(FlagEnum.AWS_API_CALL_LAMBDA);
      flags.add(FlagEnum.EXTRANEOUS);
    }
  }

  if (fqn && CustomResourceFqns.includes(fqn as any)) {
    flags.add(FlagEnum.CUSTOM_RESOURCE);
    if (fqn === ConstructInfoFqnEnum.AWS_CUSTOM_RESOURCE) {
      flags.add(FlagEnum.AWS_CUSTOM_RESOURCE);
    }
  }

  return Array.from(flags.values());
}

/**
 * Indicates if given construct is an import (eg: `s3.Bucket.fromBucketArn()`)
 */
export function isImportConstruct(construct: Construct): boolean {
  if (!Resource.isResource(construct)) {
    return false;
  }

  // CDK import constructs extend based resource classes via `class Import extends XXXBase` syntax.
  // https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/aws-s3/lib/bucket.ts#L1621
  return construct.constructor.name === "Import";
}

/**
 * Resolve an imported resources arn to tokenized hash value of arn.
 * @see {@link tokenizeImportArn}
 * @param construct {Construct} Imported resource to resolve arn for.
 * @returns If construct is an imported resource and able to infer the arn for it then the tokenized arn value is returned, otherwise undefined
 */
export function resolveImportedConstructArnToken(
  construct: Construct
): string | undefined {
  if (!isImportConstruct(construct)) {
    return undefined;
  }

  for (const [key, desc] of Object.entries(
    Object.getOwnPropertyDescriptors(construct)
  )) {
    if (
      key.endsWith("Arn") &&
      typeof desc.value === "string" &&
      desc.value.startsWith("arn:")
    ) {
      return tokenizeImportArn(Stack.of(construct).resolve(desc.value));
    }
  }

  return undefined;
}

/**
 * Generate token for imported resource arn used to resolve references.
 *
 * Imported resources are CDK `s3.Bucket.fromBucketArn()` like resources
 * that are external from the application.
 * @param value The value to tokenize, which is usually an object with nested `Fn:Join: ...["arn:", ...]` format.
 * @returns Consistent string hash prefixed with `ImportArn-` prefix.
 */
export function tokenizeImportArn(value: any): string {
  return generateConsistentUUID(value, "ImportArn-");
}

/**
 * Infers CloudFormation Type for a given import resource.
 * @param construct {Construct} Import construct such as `s3.Bucket.fromBucketArn()`.
 * @param constructInfo {ConstructInfo} Construct info like fqn
 * @returns Returns Cloudformation resource type if it can be inferred, otherwise undefined.
 */
export function inferImportCfnType(
  construct: Construct,
  constructInfo?: ConstructInfo
): string | undefined {
  if (!isImportConstruct(construct) || !constructInfo) {
    return undefined;
  }

  const [source, pkg, resourceBase] = constructInfo.fqn.split(".");

  if (
    source !== "aws-cdk-lib" ||
    !pkg.startsWith("aws_") ||
    !resourceBase ||
    !resourceBase.endsWith("Base")
  ) {
    return undefined;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkgModule = require(`aws-cdk-lib/${pkg.replace("_", "-")}`);
    const cfnResource = "Cfn" + resourceBase.replace(/Base$/, "");

    if (cfnResource in pkgModule) {
      return pkgModule[cfnResource].CFN_RESOURCE_TYPE_NAME;
    }
  } catch (error) {
    // ignore
  }

  return undefined;
}
