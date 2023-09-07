#!/usr/bin/env ts-node
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
import * as path from 'path';
import * as fs from 'fs-extra';
import { GENERATED_DIR, logCount } from './common';
import { CfnSpec } from '../../src/generated/cfnspec';
import { AwsAsset } from '../../src/generated/assets';
import { DrawioSpec } from "../../src/generated/drawio-spec";
import { findCfnTypeAssets, parseCfnType } from '../../src/internal/mapping/helpers';
import { CfnResourceMapping, CfnServiceMapping, CfnMappedResource, CfnMappedService } from '../../src/internal/mapping/types';
import { resolveResourceName } from "../../src/internal/resources/helpers";
import { extractResolvedServiceName } from "../../src/internal/services/helpers";
import { normalizeComparisonString } from "../../src/utils";
import { findAwsCategoryDefinition } from "../../src/internal/categories/definitions";
import { DRAWIO_EXPLICIT_MAPPING } from "../../src/internal/drawio/mapping";
import { PricingManifest } from "../../src/internal/pricing-manifest";
import { NORMALIZED_SERVICE_VARIANTS } from "../../src/internal/services/variants";

const MAPPINGS_TS = path.join(GENERATED_DIR, 'mappings.ts')

/** Generates `generated/mappings.ts` file */
export async function generate () {
	const services: CfnServiceMapping = {} as any;

	const drawioMapping = generateDrawioShapeToAssetMapping();
	const drawioLookup = Object.fromEntries(Object.entries(drawioMapping).reverse().map(([k, v]) => v === false ? [] : [v,DrawioSpec.Aws4.ShapeNames[k as keyof typeof DrawioSpec.Aws4.ShapeNames]]))

	const counts = {
		missingResourceAsset: 0,
		missingServiceAsset: 0,
		noAsset: 0,
		missingPricingServiceCode: 0,
	}

	const resources = Object.fromEntries(CfnSpec.ResourceTypes.map((cfnType) => {
		const { provider, serviceName } = parseCfnType(cfnType);
		const cfnAssets = findCfnTypeAssets(cfnType);

		if (!(serviceName in services)) {
			services[serviceName] = {
				provider,
				pricingServiceCode: findPricingServiceCode(serviceName, cfnAssets.serviceName),
				assetKey: cfnAssets.serviceName,
				drawioShape: cfnAssets.serviceName && drawioLookup[AwsAsset.Services[cfnAssets.serviceName]],
			}

			if (cfnAssets.serviceName == null) {
				counts.missingServiceAsset++;
			}

			if (services[serviceName].pricingServiceCode == null) {
				counts.missingPricingServiceCode++;
			}
		}
		const service: CfnMappedService = services[serviceName];

		const resource: CfnMappedResource = {
			service: serviceName,
			serviceAssetKey: cfnAssets.serviceName,
			assetKey: cfnAssets.resourceName,
			generalIconKey: cfnAssets.generalIcon,
			drawioShape: cfnAssets.resourceName && drawioLookup[AwsAsset.Resources[cfnAssets.resourceName]],
			drawioGeneralShape: cfnAssets.generalIcon && drawioLookup[AwsAsset.GeneralIcons[cfnAssets.generalIcon]],
		}

		if (resource.assetKey == null && resource.generalIconKey == null) {
			counts.missingResourceAsset++;

			if (service.assetKey === null) {
				counts.noAsset++;
			}
		}

		return [cfnType, resource]
	})) as unknown as CfnResourceMapping

	/** eslint-disable */
	const mappingTs = `// AUTO-GENERATED - DO NOT EDIT
/* eslint-disable */

/** @internal */
export const AwsServiceMapping	= ${JSON.stringify(services, null, 2)} as const;

/** @internal */
export const AwsResourceMapping	= ${JSON.stringify(resources, null, 2)} as const;

/** @internal */
export const DrawioShapeToAssetMapping = ${JSON.stringify(drawioMapping, null, 2)} as const;
`
	/** eslint-enable */

	await fs.writeFile(MAPPINGS_TS, mappingTs, { encoding: 'utf-8' })

	const missingDrawioShapesList = Object.entries(drawioMapping).filter(([,v]) => v === false).map(([k]) => DrawioSpec.Aws4.ShapeNames[k as keyof typeof DrawioSpec.Aws4.ShapeNames]);
	console.warn('Drawio[missing]:', missingDrawioShapesList.join(', '), '\n');
	logCount('Drawio[assets]', DrawioSpec.Aws4.ShapeNames, missingDrawioShapesList, true);
	logCount('Services[assets]', services, counts.missingServiceAsset, true);
	logCount('Services[pricing]', services, counts.missingPricingServiceCode, true);
	logCount('Resources[manifest]', resources,  counts.missingPricingServiceCode, true);
	logCount('Resources[assets]', resources,  counts.missingResourceAsset, true);
}

function findPricingServiceCode(...terms: (string | undefined)[]): PricingManifest.ServiceCode | undefined {
	for(const term of terms) {
		if (term == null) continue;
		const match = PricingManifest.findService(term);
		if (match) {
			return match.serviceCode;
		}
		const variants: string[] = NORMALIZED_SERVICE_VARIANTS[term as AwsAsset.Service] || [];

		for (const variant of variants) {
				const variantMatch = PricingManifest.findService(variant);
				if (variantMatch) {
					return variantMatch.serviceCode;
				}
		}
	}

	return;
}

const DRAWIO_INSTANCE_PATTERN = /^(ec2_)?(?<instanceType>.+)_instance$/i

function generateDrawioShapeToAssetMapping(): {[K in keyof typeof DrawioSpec.Aws4.ShapeNames]: string | false} {
	return Object.fromEntries(Object.entries(DrawioSpec.Aws4.ShapeNames).map(([key, shape]) => {
		if (shape in DRAWIO_EXPLICIT_MAPPING) {
			return [key, DRAWIO_EXPLICIT_MAPPING[shape]];
		}

		if (shape.startsWith('group_')) {
			const group = shape.replace('group_', '');
			if (group in AwsAsset.Groups) {
				return [key, AwsAsset.Groups[group as AwsAsset.Group]];
			}
		}

		// edge-cases
		if (shape === 'habana_gaudi') {
			return [key, AwsAsset.InstanceTypes.habana_gaudi];
		}

		// instances
		if (shape in AwsAsset.InstanceTypes) {
			return [key, AwsAsset.InstanceTypes[shape as AwsAsset.InstanceType]]
		}
		if (DRAWIO_INSTANCE_PATTERN.test(shape)) {
			const { instanceType } = shape.match(DRAWIO_INSTANCE_PATTERN)!.groups! as { instanceType: string }
			if (instanceType in AwsAsset.InstanceTypes){
				return [key, AwsAsset.InstanceTypes[instanceType as AwsAsset.InstanceType]]
			}
		}
		// iot things
		if (shape.startsWith('iot_thing_')) {
			const iotThing = shape.replace('iot_thing_', '');
			if (iotThing in AwsAsset.IotThings){
				return [key, AwsAsset.IotThings[iotThing as AwsAsset.IotThing]]
			}
		}

		if (shape in AwsAsset.Resources) {
			return [key, AwsAsset.Resources[shape as AwsAsset.Resource]];
		}
		if (shape in AwsAsset.Services) {
			return [key, AwsAsset.Services[shape as AwsAsset.Service]];
		}
		if (shape in AwsAsset.Categories) {
			return [key, AwsAsset.Categories[shape as AwsAsset.Category]];
		}
		try {
			return [key, AwsAsset.Categories[findAwsCategoryDefinition(shape).id as AwsAsset.Category]];
		} catch {};
		if (shape.replace(/^(external|generic|illustration)_/, '') in AwsAsset.GeneralIcons) {
			return [key, AwsAsset.GeneralIcons[shape.replace(/^(external|generic)_/, '') as AwsAsset.GeneralIcon]];
		}

		// there are some non-prefixed iot things
		if (shape in AwsAsset.IotThings) {
			return [key, AwsAsset.IotThings[shape as AwsAsset.IotThing]];
		}

		let extractedService = extractResolvedServiceName(shape);
		if (extractedService) {
			if (extractedService.rest == null) {
				return [key, AwsAsset.Services[extractedService.serviceName]];
			} else {
				try {
					return [key, AwsAsset.Resources[resolveResourceName(extractedService.resolvedValue, extractedService.serviceName)]];
				} catch {};
			}
		}

		// resolved
		try {
			return [key, AwsAsset.Resources[resolveResourceName(shape)]]
		} catch {};

		const comparable = normalizeComparisonString(shape);
		const potentialResources = Object.keys(AwsAsset.Resources).filter((resKey) => {
			if (resKey.endsWith(shape)) return true;
			const comparableResKey = normalizeComparisonString(resKey);
			if (comparableResKey.endsWith(comparable)) return true;
			return false;
		}) as AwsAsset.Resource[];

		if (potentialResources.length === 1) {
			return [key, AwsAsset.Resources[potentialResources[0]]]
		} else if (potentialResources.length) {
			console.warn('Found multiple drawio asset matched:', shape, potentialResources);
		}

		return [key, false];
	}))
}

if (require.main === module) {
  generate();
}
