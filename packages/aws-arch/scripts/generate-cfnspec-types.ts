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
import { resourceTypes, namespaces } from '@aws-cdk/cfnspec';
import { GENERATED_DIR } from './common';

const CFNSPEC_TS = path.join(GENERATED_DIR, 'cfnspec.ts');

/** Generates `generated/cfnspect.ts` file. */
export async function generate () {
	await fs.ensureDir(GENERATED_DIR);

	const cfnResourceTypes = resourceTypes();
	const cfnNamespaces = namespaces();
	const awsServices = cfnNamespaces.map((namespace) => namespace.split('::')[1]);

	awsServices.sort();
	cfnResourceTypes.sort();

	const cfnResourceDictionary = cfnResourceTypes.reduce((dict, cfnResourceType) => {
		const [, service, resource, ...rest] = cfnResourceType.split('::');
		if (rest.length) return dict; // ignore
		if (!(service in dict)) {
			dict[service] = {};
		}
		dict[service][resource] = cfnResourceType;
		return dict;
	}, {} as Record<string, Record<string, string>>);

	/** eslint-disable */
	const code = `// AUTO-GENERATED - DO NOT EDIT
/* eslint-disable */
export namespace CfnSpec {
	export const ServiceNames = {\n    ${awsServices.map(v => `${v}: "${v}",`).join('\n    ')}\n} as const;

	export type ServiceName = keyof typeof ServiceNames;

	export const ResourceTypes = ${JSON.stringify(cfnResourceTypes, null, 4)} as const;

	export type ResourceType = (typeof ResourceTypes)[number];

	export const ServiceResourceDictionary = ${JSON.stringify(cfnResourceDictionary, null, 4)} as const;
}
`
	/** eslint-enable */

	await fs.writeFile(CFNSPEC_TS, code, { encoding: 'utf-8' })
};


if (require.main === module) {
  generate();
}
