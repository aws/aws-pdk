/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsArchitecture, aws_arch } from "@aws-prototyping-sdk/aws-arch";
import { Graph } from "@aws-prototyping-sdk/cdk-graph";
import { GraphTheme, GraphThemeRenderingIconTarget } from "../graphviz/theme";

/** Resolves CfnResource image from {@link AwsArchitecture} asset */
export function resolveCfnResourceImage(
  node: Graph.CfnResourceNode
): string | undefined {
  let min = GraphTheme.instance.rendering.resourceIconMin;
  let max = GraphTheme.instance.rendering.resourceIconMax;
  // lower max to general when wrapped cfn resource is rendered as wrapper will show service icon
  if (node.resource?.isWrapper) {
    min = GraphThemeRenderingIconTarget.SERVICE;
  }
  return _resolveResourceLikeImage(
    node,
    min,
    max,
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
  if (node.isWrapper) {
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

  try {
    if (
      min <= GraphThemeRenderingIconTarget.DATA &&
      max >= GraphThemeRenderingIconTarget.DATA
    ) {
      const dataImage = _resolveResourceLikeDataImage(node, theme);
      if (dataImage) {
        return dataImage;
      }
    } else if (max <= GraphThemeRenderingIconTarget.DATA) {
      return;
    }

    const resource = AwsArchitecture.getResource(cfnResourceType as any);

    if (
      min <= GraphThemeRenderingIconTarget.RESOURCE &&
      max >= GraphThemeRenderingIconTarget.RESOURCE
    ) {
      try {
        const icon = resource.getResourceIcon("svg", theme);
        if (icon) {
          return icon;
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
      } catch {}
    }

    if (
      min <= GraphThemeRenderingIconTarget.SERVICE &&
      max >= GraphThemeRenderingIconTarget.SERVICE
    ) {
      try {
        const icon = resource.getServiceIcon("svg", theme);
        if (icon) {
          return icon;
        }
      } catch {}
    }

    if (
      min <= GraphThemeRenderingIconTarget.CATEGORY &&
      max >= GraphThemeRenderingIconTarget.CATEGORY
    ) {
      try {
        return resource.getCategoryIcon("svg", theme);
      } catch {}
    }

    return;
  } catch {
    return;
  }
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
