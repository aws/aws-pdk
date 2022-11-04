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

/** Mapping of service variants to asset key service name */
export const NORMALIZED_SERVICE_VARIANTS: {
  [K in AwsAsset.Service]?: string[];
} = {
  alexa_for_business: ["ask"],
  api_gateway: ["apigateway", "apigatewayv2"],
  application_discovery_service: ["appintegrations", "servicediscovery"],
  aps: ["managed_service_for_prometheus"],
  certificate_manager: ["acmpca"],
  cloudwatch: ["applicationinsights", "evidently", "logs", "rum", "synthetics"],
  console_mobile_application: ["mobile_hub"],
  connect: ["customerprofiles", "voiceid", "wisdom"],
  cost_and_usage_report: ["cur"],
  cost_explorer: ["ce"],
  data_exchange: ["dax"],
  database_migration_service: ["dms"],
  documentdb: ["docdb"],
  ec2: ["imagebuilder"],
  efs: ["elastic_file_system"],
  ebs: ["elastic_block_store", "dlm"],
  ecr: ["elastic_container_registry"],
  ecs: ["elastic_container_service", "ecs_service"],
  eks: ["elastic_kubernetes_service"],
  eventbridge: ["eventschemas", "events"],
  express_workflows: ["express_workflow"],
  fault_injection_simulator: ["fis"],
  firewall_manager: ["fms"],
  glue_databrew: ["databrew", "gluedatabrewinteractivesessions"],
  iam_identity_center: ["sso", "single_sign_on"],
  iam: [
    "identity_and_access_management",
    "identity_access_management",
    "rolesanywhere",
    "accessanalyzer",
  ],
  inspector: ["inspectorv2"],
  interactive_video_service: ["ivs"],
  iot_core: ["iot", "iotwireless"],
  iot_device_management: ["iotfleethub"],
  iot_greengrass: ["greengrass", "greengrassv2"],
  key_management_service: ["kms"],
  keyspaces: ["cassandra", "managed_apache_cassandra_service"],
  kinesis_data_analytics: ["kinesisanalytics", "kinesisanalyticsv2"],
  kinesis_data_streams: ["kinesis"],
  kinesis_firehose: ["firehose"],
  kinesis_video_streams: ["kinesisvideo"],
  location_service: ["location"],
  mainframe_modernization: ["m2"],
  managed_blockchain: ["qldb"],
  managed_grafana: ["managed_service_for_grafana"],
  memorydb_for_redis: ["memorydb"],
  migration_hub: ["refactorspaces"],
  msk: [
    "managed_streaming_for_apache_kafka",
    "managed_streaming_for_kafka",
    "kafkaconnect",
    "kafka",
  ],
  mwaa: [
    "managed_workflows_for_apache_airflow",
    "managed_workflows_for_airflow",
    "airflow",
  ],
  opensearch: [
    "opensearch_service",
    "opensearch",
    "elasticsearch",
    "elasticsearch_service",
  ],
  outposts_rack: ["outposts_1u_and_2u_servers"],
  quantum_ledger_database: ["qldb"],
  pinpoint: ["pinpointemail"],
  resource_access_manager: ["ram"],
  s3_glacier: ["simple_storage_service_glacier", "glacier"],
  s3: ["simple_storage_service"],
  serverless_application_repository: ["serverless", "serverlessdiscovery"],
  ses: ["simple_email_service"],
  sns: ["simple_notification_service"],
  sqs: ["simple_queue_service"],
  ssm: ["systems_manager", "resourcegroups"],
  transfer_family: ["transfer"],
  vpc: ["virtual_private_cloud", "networkmanager"],
  well_architected_tool: ["well_architect_tool"],
  network_firewall: ["fms", "networkfirewall"],
};
