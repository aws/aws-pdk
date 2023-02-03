/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { AwsAsset } from "../../generated/assets";
import { DrawioSpec } from "../../generated/drawio-spec";

/** Explicit mapping of drawio shapes to asset keys */
export const DRAWIO_EXPLICIT_MAPPING: {
  [K in DrawioSpec.Aws4.ShapeNames]?: string;
} = {
  access_analyzer: AwsAsset.Resources.iam_iam_access_analyzer,
  agent: AwsAsset.Resources.inspector_agent,
  agent2: AwsAsset.Resources.datasync_agent,
  cluster: AwsAsset.Resources.emr_cluster,
  connect: AwsAsset.Resources.iot_greengrass_connector,
  archive: AwsAsset.Resources.s3_glacier_archive,
  endpoints: AwsAsset.Resources.vpc_endpoints,
  endpoint: AwsAsset.Resources.network_firewall_endpoints,
  gateway: AwsAsset.Resources.direct_connect_gateway,
  instance: AwsAsset.Resources.ec2_instance,
  instances: AwsAsset.Resources.ec2_instances,
  intelligent_tiering: AwsAsset.Resources.s3_s3_intelligent_tiering,
  // iot_over_the_air_update: AwsAsset.Resources['iot_core_over_air_update'],
  registry: AwsAsset.Resources.ecr_registry,
  router: AwsAsset.Resources.vpc_router,
  simulator: AwsAsset.Resources.iot_core_simulator,
  table: AwsAsset.Resources.dynamodb_table,
  topic_2: AwsAsset.Resources.iot_core_topic,
  topic: AwsAsset.Resources.sns_topic,
  vault: AwsAsset.Resources.s3_glacier_vault,
  volume: AwsAsset.Resources.ebs_volume,
  peering: AwsAsset.Resources.vpc_peering_connection,
  service: AwsAsset.Services.ec2,
};
