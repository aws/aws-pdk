/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  CfnElement,
  IInspectable,
  Names,
  Stack,
  TreeInspector,
} from "aws-cdk-lib";
import { Construct, IConstruct } from "constructs";
import cloneDeep = require("lodash.clonedeep"); // eslint-disable-line @typescript-eslint/no-require-imports
import shorthash = require("shorthash2"); // eslint-disable-line @typescript-eslint/no-require-imports
import traverse = require("traverse"); // eslint-disable-line @typescript-eslint/no-require-imports
import { ConstructInfo, constructInfoFromConstruct } from "../cdk-internals";
import {
  AssetFqnEnum,
  CdkConstructIds,
  CfnAttributesEnum,
  ExtraneousFqnEnum,
  FlagEnum,
  MetadataTypeEnum,
  ReferenceTypeEnum,
  SerializedGraph,
  UnresolvedReference,
  UUID,
} from "./types";

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
    dependencies: construct.node.dependencies.map(getConstructUUID),
    unresolvedReferences: extractUnresolvedReferences(uuid, attributes),
    flags,
  };
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
        break;
      }
    }
  });

  return references;
}

/** Infer construct flags  */
export function inferFlags(
  construct: IConstruct,
  constructInfo?: ConstructInfo
): FlagEnum[] {
  const flags: Set<FlagEnum> = new Set();

  const fqn = constructInfo?.fqn;

  if (fqn && ExtraneousFqnEnum.includes(fqn as any)) {
    flags.add(FlagEnum.EXTRANEOUS);
  }

  if (fqn && AssetFqnEnum.includes(fqn as any)) {
    flags.add(FlagEnum.ASSET);
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

  return Array.from(flags.values());
}
