/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { CATEGORY_ICON, SERVICE_ICON } from "../../contants";
import { AwsAsset } from "../../generated/assets";
import {
  AwsCategoryDefinitions,
  AwsCategoryId,
} from "../categories/definitions";

/** Parsed asset key */
export interface ParsedAssetKey {
  /** Reference to the full key that was parsed */
  readonly assetKey: string;
  /** Category id */
  readonly category: AwsCategoryId;
  /** Service id if key is partitioned by resource */
  readonly service?: AwsAsset.Service;
  /** Resource id if key is for a resource */
  readonly resource?: AwsAsset.Resource;
  /** The last segment of the key (which is the nested icon). For instances and things this includes the dir prefix. */
  readonly basename: string;
  /** The instance type if key is for an ec2 instance */
  readonly instanceType?: AwsAsset.InstanceType;
  /** The iot thing if key is for an iot thing */
  readonly iotThing?: AwsAsset.IotThing;
}

/** Parse asset key into parts */
export function parseAssetPath(assetPath: string): ParsedAssetKey {
  if (assetPath.endsWith(CATEGORY_ICON)) {
    const [category] = assetPath.split("/") as [AwsCategoryId, string];
    return { assetKey: assetPath, category, basename: CATEGORY_ICON };
  }
  if (assetPath.endsWith(SERVICE_ICON)) {
    const [category, service] = assetPath.split("/") as [
      AwsCategoryId,
      AwsAsset.Service,
      string
    ];
    return { assetKey: assetPath, category, service, basename: SERVICE_ICON };
  }

  if (assetPath.startsWith(AwsCategoryDefinitions.general.id)) {
    const [, basename] = assetPath.split("/") as [AwsCategoryId, string];
    return {
      assetKey: assetPath,
      category: AwsCategoryDefinitions.general.id as AwsCategoryId,
      basename,
    };
  }

  if (assetPath.startsWith("compute/ec2/instance/")) {
    const [category, service, instanceDir, instanceType] = assetPath.split(
      "/"
    ) as [AwsCategoryId, AwsAsset.Service, "instance", AwsAsset.InstanceType];
    return {
      assetKey: assetPath,
      category,
      service,
      instanceType,
      basename: instanceDir + "/" + instanceType,
    };
  }

  if (assetPath.startsWith("internet_of_things/thing/")) {
    const [category, service, thingDir, iotThing] = assetPath.split("/") as [
      AwsCategoryId,
      AwsAsset.Service,
      "thing",
      AwsAsset.IotThing
    ];
    return {
      assetKey: assetPath,
      category,
      service,
      iotThing,
      basename: thingDir + "/" + iotThing,
    };
  }

  const [category, service, basename] = assetPath.split("/") as [
    AwsCategoryId,
    AwsAsset.Service,
    string
  ];
  const resource = `${service}_${basename}` as AwsAsset.Resource;
  return { assetKey: assetPath, category, service, resource, basename };
}
