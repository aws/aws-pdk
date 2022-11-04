/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */
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
