/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import {
  Annotations,
  CfnOutput,
  CfnParameter,
  CfnStack,
  NestedStack,
  Resource,
  Stack,
} from "aws-cdk-lib";
import { IConstruct } from "constructs";
import merge = require("lodash.merge"); // eslint-disable-line @typescript-eslint/no-require-imports
import uniq = require("lodash.uniq"); // eslint-disable-line @typescript-eslint/no-require-imports
import uniqBy = require("lodash.uniqby"); // eslint-disable-line @typescript-eslint/no-require-imports
import { GRAPH_ID } from "./constants";
import { Graph } from "./graph";
import {
  CdkConstructIds,
  ConstructInfoFqnEnum,
  FlagEnum,
  LOGICAL_UNIVERSAL_ID,
  NodeTypeEnum,
  ReferenceTypeEnum,
  UnresolvedReference,
  UUID,
} from "./types";
import {
  extractUnresolvedReferences,
  generateConsistentUUID,
  getConstructUUID,
  inferNodeProps,
} from "./utils";

// [source: UUID, target: UUID]
type UnresolvedDependency = [UUID, UUID];

/** List of cdk stack children used by cdk that the graph ignores */
const IGNORED_STACK_CHILDREN = [
  "CDKMetadata",
  "BootstrapVersion",
  "CheckBootstrapVersion",
];

/**
 * Computes the graph store for a given Cdk construct, usually App.
 * @internal
 */
export function computeGraph(root: IConstruct): Graph.Store {
  const store = new Graph.Store();

  // List of nodes that should not be processed (extraneous nodes detected during compute)
  // NB: example is stack template construct which cdk creates as sibling of nested stacks,
  // we care about the stack and not the marshalled construct.
  const nodesToIgnore: UUID[] = [];

  // List of all unresolved referenced detected during compute, which are resolved after all nodes have been stored
  const allUnresolvedReferences: UnresolvedReference[] = [];
  // List of all unresolved dependencies detected during compute, which are resolved after all nodes have been stored
  const allUnresolvedDependencies: UnresolvedDependency[] = [];

  const visit = (construct: IConstruct, parent: Graph.Node): void => {
    // Do not graph the CdkGraph itself
    if (construct.node.id === GRAPH_ID) {
      return;
    }

    // Do not graph the Tree construct (synthesizes tree.json)
    if (Graph.AppNode.isAppNode(parent) && construct.node.id === "Tree") {
      return;
    }

    // Do not graph stack CDKMetadata, BootstrapVersion, and similar constructs
    if (
      Graph.StackNode.isStackNode(parent) &&
      IGNORED_STACK_CHILDREN.includes(construct.node.id)
    ) {
      return;
    }

    const {
      uuid,
      attributes = {},
      metadata = [],
      tags = {},
      logicalId,
      cfnType,
      constructInfo,
      dependencies,
      unresolvedReferences,
      flags,
    } = inferNodeProps(construct);

    if (nodesToIgnore.includes(uuid)) {
      return;
    }

    // Infer the stack this construct belongs to
    let stack: Graph.StackNode | undefined;
    try {
      if (construct.node.scope) {
        const stackUUID = getConstructUUID(Stack.of(construct));
        stack = store.getStack(stackUUID);
      }
    } catch {
      // ignore - expected to throw if construct is not contained in a stack
    }

    const nodeProps: Graph.ITypedNodeProps = {
      store,
      stack,
      parent,
      uuid,
      id: construct.node.id,
      path: construct.node.path,
      attributes,
      metadata,
      tags,
      constructInfo,
      logicalId,
      cfnType,
      flags,
    };

    let node: Graph.Node;
    switch (constructInfo?.fqn as ConstructInfoFqnEnum) {
      case ConstructInfoFqnEnum.APP: {
        node = new Graph.AppNode({
          store,
          parent,
          attributes,
          metadata,
          tags,
          constructInfo,
          logicalId,
          flags,
        });
        break;
      }
      case ConstructInfoFqnEnum.STAGE: {
        node = new Graph.StageNode(nodeProps);
        break;
      }
      case ConstructInfoFqnEnum.STACK: {
        node = new Graph.StackNode(nodeProps);
        break;
      }
      case ConstructInfoFqnEnum.NESTED_STACK: {
        // NB: handle NestedStack<->CfnStack as single Node with NestedStack construct as source
        // https://github.com/aws/aws-cdk/blob/119c92f65bf26c3fdf4bb818a4a4812022a3744a/packages/%40aws-cdk/core/lib/nested-stack.ts#L119

        const parentStack = inferNodeProps(
          (construct as NestedStack).nestedStackParent!
        );
        const _nestedStack = construct.node.scope!.node.findChild(
          construct.node.id + ".NestedStack"
        );
        const cfnStackWrapper = inferNodeProps(_nestedStack);
        const cfnStack = inferNodeProps(
          _nestedStack.node.findChild(
            construct.node.id + ".NestedStackResource"
          ) as CfnStack
        );

        // ignore parent scope cfn stack (template) constructs
        nodesToIgnore.push(cfnStackWrapper.uuid, cfnStackWrapper.uuid);

        node = new Graph.NestedStackNode({
          ...nodeProps,
          logicalId: cfnStack.logicalId,
          attributes: merge(
            {},
            attributes,
            cfnStackWrapper.attributes,
            cfnStack.attributes
          ),
          metadata: [
            ...metadata,
            ...(cfnStackWrapper.metadata || []),
            ...(cfnStack.metadata || []),
          ],
          parentStack: store.getStack(parentStack.uuid),
        });

        // Only add uniq dependencies as wrapper and stack may duplicate
        dependencies.push(
          ...uniq([...cfnStackWrapper.dependencies, ...cfnStack.dependencies])
        );

        // Only add uniq references as wrapper and stack may duplicate
        unresolvedReferences.push(
          ...uniqBy(
            [
              ...cfnStackWrapper.unresolvedReferences.map((ref) => ({
                ...ref,
                source: uuid,
              })),
              ...cfnStack.unresolvedReferences.map((ref) => ({
                ...ref,
                source: uuid,
              })),
            ],
            (v) =>
              `${v.referenceType}::${v.source}::${v.target}::${JSON.stringify(
                v.value || ""
              )}`
          )
        );

        break;
      }
      case ConstructInfoFqnEnum.CFN_STACK: {
        // CfnStack always proceeds NestedStack, based on above case we merge CfnStack into
        // NestedStack (mirror developer expectations) and then ignore CfnStack.
        throw new Error(`CfnStack should be ignored by NestedStack: ${uuid}`);
      }
      case ConstructInfoFqnEnum.CFN_OUTPUT: {
        node = new Graph.OutputNode({
          ...nodeProps,
          value: Stack.of(construct).resolve((construct as CfnOutput).value),
          description: Stack.of(construct).resolve(
            (construct as CfnOutput).description
          ),
          exportName: Stack.of(construct).resolve(
            (construct as CfnOutput).exportName
          ),
        });

        // extract unresolved references from value
        unresolvedReferences.push(
          ...extractUnresolvedReferences(
            node.uuid,
            (node as Graph.OutputNode).value || {}
          )
        );

        break;
      }
      case ConstructInfoFqnEnum.CFN_PARAMETER: {
        const cfnParameter = construct as CfnParameter;
        node = new Graph.ParameterNode({
          ...nodeProps,
          value: Stack.of(construct).resolve(cfnParameter.value),
          description: Stack.of(construct).resolve(cfnParameter.description),
          parameterType: cfnParameter.type,
        });
        break;
      }
      default: {
        if (Resource.isResource(construct)) {
          node = new Graph.ResourceNode({
            ...nodeProps,
            cdkOwned: Resource.isOwnedResource(construct),
          });
        } else if (cfnType) {
          node = new Graph.CfnResourceNode(nodeProps);
        } else {
          node = new Graph.Node({
            nodeType: NodeTypeEnum.DEFAULT,
            ...nodeProps,
          });

          // Cdk Stack.Exports is proxy to actual Cfn exports and extraneous in the graph
          if (
            construct.node.id === CdkConstructIds.EXPORTS &&
            Stack.isStack(construct.node.scope)
          ) {
            node.addFlag(FlagEnum.EXTRANEOUS);
          }
        }
      }
    }

    // Track unresolved dependencies, since nodes might not be created in the store yet
    allUnresolvedDependencies.push(
      ...dependencies.map((dep) => [uuid, dep] as [string, string])
    );

    // Track all logicalId references in the nodes attributes
    // this will get resolved after all nodes have been stored
    allUnresolvedReferences.push(...unresolvedReferences);

    // Visit all child to compute the tree
    for (const child of construct.node.children) {
      try {
        visit(child, node);
      } catch (e) {
        Annotations.of(root).addWarning(
          `Failed to render graph for node ${child.node.path}. Reason: ${e}`
        );
        throw e;
      }
    }
  };

  visit(root, store.root);

  // Resolve all references - now that the tree is stored
  for (const unresolved of allUnresolvedReferences) {
    try {
      resolveReference(store, unresolved);
    } catch (e) {
      console.warn(e, unresolved);
      // TODO: consider saving unresolved references if become valuable.
    }
  }

  // Resolve all dependencies - now that the tree is stored
  for (const unresolved of allUnresolvedDependencies) {
    resolveDependency(store, unresolved);
  }

  return store;
}

/**
 * Resolve reference. During initial graph traversal not all nodes have been added at the time
 * a reference has been detected, as such we need to resolve all references after the graph tree
 * has been stored.
 * @internal
 */
function resolveReference(
  store: Graph.Store,
  unresolved: UnresolvedReference
): Graph.Reference {
  const source = store.getNode(unresolved.source);
  if (source.stack == null) {
    console.warn(String(source), source);
    throw new Error(`Node ${source} is not within stack`);
  }

  let target: Graph.Node;

  switch (unresolved.referenceType) {
    case ReferenceTypeEnum.REF: {
      // ref logicalId is only unique in the stack
      target = store.findNodeByLogicalId(source.stack, unresolved.target);
      return new Graph.Reference({
        store,
        uuid: generateConsistentUUID(unresolved, Graph.Reference.PREFIX),
        referenceType: ReferenceTypeEnum.REF,
        source,
        target,
      });
    }
    case ReferenceTypeEnum.IMPORT: {
      // imports already contain the stack id (stack:logicalId)
      target = store.findNodeByLogicalUniversalId(
        unresolved.target as LOGICAL_UNIVERSAL_ID
      );
      return new Graph.ImportReference({
        store,
        uuid: generateConsistentUUID(unresolved, Graph.ImportReference.PREFIX),
        source,
        target,
      });
    }
    case ReferenceTypeEnum.ATTRIBUTE: {
      const attribute = unresolved.value as string;
      if (attribute && attribute.startsWith("Outputs.")) {
        // Stack output reference
        const stacksToSearch = source.rootStack?.stage?.stacks || store.stacks;
        const potentialRefStacks = Object.values(stacksToSearch).filter(
          (_stack) => _stack.logicalId === unresolved.target
        );
        if (potentialRefStacks.length === 1) {
          const refStack = potentialRefStacks[0];
          target = refStack.findOutput(attribute.replace("Outputs.", ""));
        } else {
          console.warn(
            "Failed to find logical id from attribute reference:",
            unresolved.target
          );
          if (potentialRefStacks.length) {
            console.warn(
              "Found multiple matching stacks:",
              Object.values(potentialRefStacks).map(
                (stack) => `${String(stack)}:${stack.logicalId || "ROOT"}`
              )
            );
          } else {
            console.warn(
              "Available stacks:",
              Object.values(store.stacks).map(
                (stack) => `${String(stack)}:${stack.logicalId || "ROOT"}`
              )
            );
          }
          throw new Error(
            `Failed to find Fn::GetAtt stack for output reference "${unresolved.target}": ${potentialRefStacks.length}`
          );
        }
      } else {
        target = store.findNodeByLogicalId(source.stack, unresolved.target);
      }

      if (target) {
        return new Graph.AttributeReference({
          store,
          uuid: generateConsistentUUID(
            unresolved,
            Graph.AttributeReference.PREFIX
          ),
          source,
          target,
          value: attribute,
        });
      }
    }
  }

  throw new Error(`Failed to resolve reference: ${JSON.stringify(unresolved)}`);
}

/**
 * Resolve dependency. During initial graph traversal not all nodes have been added at the time
 * a dependency has been detected, as such we need to resolve all dependencies after the graph tree
 * has been stored.
 * @internal
 */
function resolveDependency(
  store: Graph.Store,
  unresolved: UnresolvedDependency
): Graph.Dependency {
  const source = store.getNode(unresolved[0]);
  const target = store.getNode(unresolved[1]);

  return new Graph.Dependency({
    store,
    uuid: generateConsistentUUID(unresolved, Graph.Dependency.PREFIX),
    source,
    target,
  });
}
