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
// @ts-ignore - won't exist until generated
import type { AwsAsset } from "../../generated/assets";

/** Mapping of variant resource names to asset resource name */
export const NORMALIZED_RESOURCE_VARIANTS: {
  [K in AwsAsset.Resource]?: string[];
} = {
  storage_gateway_cached_volume: ["cached_volume"],
  storage_gateway_file_gateway: ["file_gateway"],
  sagemaker_notebook: ["notebook"],
  iam_permissions: ["permissions"],
  ecr_image: ["container_registry_image"],
  iam_sts: ["sts"],
  efs_standard_infrequent_access: ["elastic_file_system_infrequent_access"],
  efs_standard: ["elastic_file_system_one_zone_standard"],
  s3_s3_standard_ia: ["infrequent_access_storage_class"],
  directory_service_managed_microsoft_ad: ["managed_ms_ad"],
  eventbridge_custom_event_bus: ["custom_event_bus_resource"],
  eventbridge_default_event_bus: ["default_event_bus_resource"],
  ebs_data_lifecycle_manager: [
    "elastic_block_store_amazon_data_lifecycle_manager",
  ],
  iot_device_defender_iot_device_jobs: ["iot_device_jobs_resource"],
  ebs_multiple_volumes: ["multiple_volumes_resource", "multiple_volumes"],
  eventbridge_saas_partner_event: ["saas_event_bus_resource"],
  managed_blockchain_blockchain: ["qldb"],
  transfer_family_ftp: ["transfer_for_ftp_resource"],
  transfer_family_ftps: ["transfer_for_ftps_resource"],
  transfer_family_sftp: ["transfer_for_sftp_resource"],
};
