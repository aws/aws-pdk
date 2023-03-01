/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsArchitecture, aws_arch } from "@aws-prototyping-sdk/aws-arch";
import { FlagEnum, Graph } from "@aws-prototyping-sdk/cdk-graph";
import { GraphTheme, GraphThemeRenderingIconTarget } from "../graphviz/theme";

/** Resolves CfnResource image from {@link AwsArchitecture} asset */
export function resolveCfnResourceImage(
  node: Graph.CfnResourceNode
): string | undefined {
  return _resolveResourceLikeImage(
    node,
    GraphTheme.instance.rendering.cfnResourceIconMin,
    GraphTheme.instance.rendering.cfnResourceIconMax,
    GraphTheme.instance.awsTheme?.id
  );
}

/** Resolves Resource image from {@link AwsArchitecture} asset */
export function resolveResourceImage(
  node: Graph.ResourceNode
): string | undefined {
  let min = GraphTheme.instance.rendering.resourceIconMin;
  let max = GraphTheme.instance.rendering.resourceIconMax;
  // elevate min to service when wrapped cfn resource is rendered
  if (
    node.cfnResource &&
    node.cfnResource.hasFlag(FlagEnum.WRAPPED_CFN_RESOURCE)
  ) {
    min = GraphThemeRenderingIconTarget.SERVICE;
  }
  return _resolveResourceLikeImage(
    node,
    min,
    max,
    GraphTheme.instance.awsTheme?.id
  );
}

/** Resolves CustomResource image from {@link AwsArchitecture} asset */
export function resolveCustomResourceImage(
  _node: Graph.Node
): string | undefined {
  return AwsArchitecture.getResource(
    "AWS::CloudFormation::CustomResource"
  ).icon("svg", GraphTheme.instance.awsTheme?.id);
}

/** Resolves Resource image from {@link AwsArchitecture} asset */
function _resolveResourceLikeImage(
  node: Graph.ResourceNode | Graph.CfnResourceNode,
  min: GraphThemeRenderingIconTarget,
  max: GraphThemeRenderingIconTarget,
  theme?: aws_arch.Themes
): string | undefined {
  const cfnResourceType = node.cfnType;

  if (
    min <= GraphThemeRenderingIconTarget.DATA &&
    max >= GraphThemeRenderingIconTarget.DATA
  ) {
    const dataImage = _resolveResourceLikeDataImage(node, theme);
    if (dataImage) {
      return dataImage;
    }
  }

  if (
    min <= GraphThemeRenderingIconTarget.RESOURCE &&
    max >= GraphThemeRenderingIconTarget.RESOURCE
  ) {
    try {
      const resource = AwsArchitecture.getResource(cfnResourceType as any);
      const resourceIcon = resource.getResourceIcon("svg", theme);
      if (resourceIcon) {
        return resourceIcon;
      }
      if (
        min <= GraphThemeRenderingIconTarget.GENERAL &&
        max >= GraphThemeRenderingIconTarget.GENERAL
      ) {
        const generalIcon = resource.getGeneralIcon("svg", theme);
        if (generalIcon) {
          return generalIcon;
        }
      }
    } catch {
      // if there is no resource definition found, then there won't be a service or category which are resource based
      return undefined;
    }
  }

  if (
    min <= GraphThemeRenderingIconTarget.SERVICE &&
    max >= GraphThemeRenderingIconTarget.SERVICE
  ) {
    try {
      return AwsArchitecture.getResource(cfnResourceType as any).getServiceIcon(
        "svg",
        theme
      );
    } catch {}
  }

  if (
    min <= GraphThemeRenderingIconTarget.CATEGORY &&
    max >= GraphThemeRenderingIconTarget.CATEGORY
  ) {
    try {
      return AwsArchitecture.getResource(
        cfnResourceType as any
      ).getCategoryIcon("svg", theme);
    } catch {}
  }

  return undefined;
}

/** Resolves CfnResource image from {@link AwsArchitecture} asset */
function _resolveResourceLikeDataImage(
  node: Graph.CfnResourceNode | Graph.ResourceNode,
  theme?: aws_arch.Themes
): string | undefined {
  const cfnResourceType = node.cfnType;

  if (
    cfnResourceType === aws_arch.CfnSpec.ServiceResourceDictionary.EC2.Instance
  ) {
    const instanceType = node.getCfnProp("instanceType") as string | undefined;
    if (instanceType) {
      try {
        return AwsArchitecture.getInstanceTypeIcon(
          instanceType.toLowerCase().split(".")[0] as any,
          "svg",
          theme
        );
      } catch {}
    }
  }

  if (
    cfnResourceType ===
    aws_arch.CfnSpec.ServiceResourceDictionary.RDS.DBInstance
  ) {
    let engine = node.getCfnProp("engine") as string | undefined;
    if (engine) {
      engine = engine.toLowerCase().split("-")[0] as any;
      // Resolve postgresql variant
      if (engine === "postgres") {
        engine = "postgresql";
      }
      try {
        // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbinstance.html#cfn-rds-dbinstance-engine
        return AwsArchitecture.getRdsInstanceTypeIcon(
          engine as any,
          "svg",
          theme
        );
      } catch {}
    }
  }

  return undefined;
}
