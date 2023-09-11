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
import * as path from 'node:path';
import * as fs from 'fs-extra';
import { GENERATED_DIR, logCount } from './common';
import { normalizeComparisonString, parseAwsUrl } from "../../src/utils";
import { sortedUniq } from "lodash";

const PRICING_MANIFEST_JSON = path.join(__dirname, '..', '..', 'static', 'aws-pricing-manifest.json');

const PRICING_MANIFEST_TS = path.join(GENERATED_DIR, 'pricing-manifest.ts');

/** Generates `generated/pricing-manifest.ts` file. */
export async function generate () {
  const slugs = new Set<string>();
  const missingSlugs = new Set<string>();
  const missingLinkUrl = new Set<string>();
  // mapping of serviceCode to parentServiceCodes
  const parentServiceCodeMap = new Map<string, string>();

  function addToUniqueSet(set: Set<string>, value: string) {
    if (set.has(value)) {
      throw new Error(`Value "${value}" already in set`)
    }
    set.add(value);
  }

  const manifest = (require(PRICING_MANIFEST_JSON).awsServices as any[]).reduce((dict, service) => {
    service = transformServiceForJsii(service);
    const serviceCode: string = service.serviceCode;
    const isSubFor = isSubServiceForDefinition(service);
    const comparableTerms: string[] = [
      normalizeComparisonString(service.serviceCode),
      normalizeComparisonString(isSubFor ? service.description : service.name),
    ];

    // Extract common name from name with parens: DynamoDB Accelerator (DAX) clusters => DAX
    const parenName: string | undefined = (service.name.match(/\(([^)]+)\)/) || [])[1];
    if (parenName) {
      comparableTerms.push(normalizeComparisonString(parenName))
    }

    const subType = service.subType as undefined | "subService" | "subServiceSelector";
    if (subType === "subServiceSelector") {
      // this is a parent pricing service
      (service.templates as string[] || []).forEach((template) => {
        parentServiceCodeMap.set(template, serviceCode);
      })
    }

    if(service.slug) {
      addToUniqueSet(slugs, service.slug);
      comparableTerms.push(normalizeComparisonString(service.slug))
    } else {
      missingSlugs.add(serviceCode);
    }

    if (service.linkUrl) {
      try {
        const url = parseAwsUrl(service.linkUrl);
        if (["subServiceSelector", undefined].includes(subType) && !url.code.startsWith("ec2_pricing")) {
          comparableTerms.push(normalizeComparisonString(url.code));
        }
      } catch {
        console.log("Unsupported link url:", serviceCode, service.linkUrl);
      }
    } else {
      missingLinkUrl.add(serviceCode);
    }

    service.comparableTerms = sortedUniq(comparableTerms.flatMap((term) => {
      return [term, term.replace(/(Svc|Service)$/i, "")]
    }).sort());

    dict[serviceCode] = service;
    return dict;
  }, {} as any);

  // add reference to parent from children
  for(const [_child, _parent] of parentServiceCodeMap) {
    manifest[_child].parentServiceCode = _parent;
  }

  /* eslint-disable */
  await fs.writeFile(PRICING_MANIFEST_TS, `// AUTO-GENERATED - DO NOT EDIT
/* eslint-disable */
export const PRICING_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;

export const PRICING_SLUGS = ${JSON.stringify(Array.from(slugs), null, 2)} as const;
`)
  /** eslint-enable **/

  const totalServices = Object.keys(manifest).length;
  logCount('Slugs[missing]', totalServices, missingSlugs);
  logCount('LinkUrls[missing]', totalServices, missingLinkUrl);
  console.info(`Total ${totalServices} services`);
};

function transformServiceForJsii(service: any): any {
  const { MVPSupport, ...rest } = service;

  return {
    ...rest,
    mvpSupport: MVPSupport,
  }
}

// Some service "name" props are scoped to parent service and collide with actual service.
// eg: amazonDocumentDbBackup.name = DocumentDB, collides with actual DocumentDB service.
// In this case we ensure comparables are scoped to parent service - "Backup DocumentDB" instead of "DocumentDB"
function isSubServiceForDefinition(service: any): boolean {
  if (service.description?.endsWith(` for ${service.name}`)) {
    return true;
  }
  return false;
}

if (require.main === module) {
  generate();
}
