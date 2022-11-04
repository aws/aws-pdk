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
import { CfnSpec } from "../../generated/cfnspec";
import { DrawioSpec } from "../../generated/drawio-spec";
import { PricingManifest } from "../pricing-manifest";

/**
 * AwsService represents the inferred normalization between [@aws-cdk/cfnspec](https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/cfnspec)
 * and [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) systems
 * for a given AWS "service".
 * @struct
 * @internal
 */
export interface CfnMappedService {
  readonly provider: string;
  readonly pricingServiceCode?: PricingManifest.ServiceCode;
  readonly assetKey?: AwsAsset.Service;
  readonly drawioShape?: DrawioSpec.Aws4.ShapeNames;
}

/**
 * AwsResource represents the inferred normalization between [@aws-cdk/cfnspec](https://github.com/aws/aws-cdk/blob/main/packages/%40aws-cdk/cfnspec)
 * and [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) systems
 * for a given AWS "resource".
 * @struct
 * @internal
 */
export interface CfnMappedResource {
  readonly service: CfnSpec.ServiceName;
  readonly serviceAssetKey?: AwsAsset.Service;
  readonly assetKey?: AwsAsset.Resource;
  readonly generalIconKey?: AwsAsset.GeneralIcon;
  readonly drawioShape?: DrawioSpec.Aws4.ShapeNames;
  readonly drawioGeneralShape?: DrawioSpec.Aws4.ShapeNames;
}

/**
 * Record of all {@link CfnMappedService}s keyed by {@link CfnSpec.ServiceName}
 * @internal
 */
export type CfnServiceMapping = {
  [K in CfnSpec.ServiceName]: CfnMappedService;
};

/**
 * Record of all {@link CfnMappedResource}s keyed by {@link CfnSpec.ResourceType}
 * @internal
 */
export type CfnResourceMapping = {
  [K in CfnSpec.ResourceType]: CfnMappedResource;
};
