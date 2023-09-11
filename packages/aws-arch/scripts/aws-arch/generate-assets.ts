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
import * as util from 'util';
import * as stream from 'stream';
import * as fs from 'fs-extra';
import fetch from 'node-fetch';
import { Parse as ZipParse } from 'unzipper';
import sharp = require('sharp'); // eslint-disable-line @typescript-eslint/no-require-imports
import tree = require('tree-cli'); // eslint-disable-line @typescript-eslint/no-require-imports
import { TMP_DIR, GENERATED_DIR, listDirFiles } from './common';
import { normalizeIdentifier } from "../../src/utils";
import { GENERAL_CATEGORY_ID, findAwsCategoryDefinition } from "../../src/internal/categories/definitions";
import { NORMALIZED_SERVICE_VARIANTS } from "../../src/internal/services/variants";
import { ASSET_DIRNAME, CATEGORY_ICON, PNG_ASSET_SIZE, SERVICE_ICON } from "../../src/contants";

// Update this url to fetch updated versions of icons from https://aws.amazon.com/architecture/icons/
// This should be the zip url of the "Asset Package" link
const ASSET_PACKAGE_ZIP_URL = 'https://d1.awsstatic.com/webteam/architecture-icons/q3-2022/Asset-Package_07312022.e9f969935ef6aa73b775f3a4cd8c67af2a4cf51e.zip';
const ASSET_PACKAGE_ZIP_FILENAME = path.basename(ASSET_PACKAGE_ZIP_URL);

const STATIC_ASSETS = path.resolve(__dirname, '..', '..', 'static');
const ASSET_PACKAGE_DIR = path.resolve(__dirname, '..', '..', ...ASSET_DIRNAME.split('/'));

const AWS_ASSETS_TS = path.join(GENERATED_DIR, 'assets.ts');

const ASSETS_MARKDOWN = path.join(__dirname, "..", "..", 'ASSETS.md');

const EXT_PNG = ".png";
const EXT_SVG = ".svg";

const ASSET_PATTERNS = {
  CATEGORY: /Category-Icons_\d+\/Arch-Category_64\/Arch-Category_(?<category>[^_]+)_64\.svg$/,
  SERVICE: /Architecture-Service-Icons_\d+\/Arch_(?<category>[^/]+)\/(Arch_)?64\/Arch_(?<serviceName>[^_]+)_64\.svg$/,
  RESOURCE: /Resource-Icons_\d+\/Res_(?<category>[^/]+)\/Res_48_(Light|Dark)\/Res_(?<serviceName>[^_]+)_(?<resourceName>[^_ ]+) ?_48_((?<theme>Light|Dark))\.svg$/,
  RDS_INSTANCE: /Resource-Icons_\d+\/Res_(?<category>database)\/Res_48_(Light|Dark)\/Res_(?:(?<serviceName>[^_]+)_)?(?<instanceType>[^_ ]+) ?-Instance(?<alt>-Al?ternat(?:e|ative)?)?_48_((?<theme>Light|Dark))\.svg$/i,
  GENERAL: /(Arch|Res)_General-Icons\/(64|Res_48_(Light|Dark))\/(Arch|Res)_(?<generalIcon>[^_]+)_.*(?<theme>Light|Dark).*\.svg$/,
};

const EC2_INSTANCE_PATTERN = /compute\/ec2\/(?<instanceType>\w+)_instance$/i;

const IOT_THING_PATTERN = /internet_of_things\/iot_thing\/(?<thingType>\w+)$/i;

const DEFAULT_THEME = 'light';

// List of "general" resources used by other resources from common resources
// Lots of services have logs, rules, policies, which are pulled from IAM
// TODO: convert generic assets to grayscale
const GENERAL_ALIASES = {
  acl: 'networking_content_delivery/vpc/network_access_control_list',
  alarm: 'management_governance/cloudwatch/alarm',
  attachment: 'networking_content_delivery/transit_gateway/attachment',
  config: 'general/gear',
  configuration: 'general/gear',
  credentials_long: 'security_identity_compliance/iam/long_term_security_credential',
  credentials_temp: 'security_identity_compliance/iam/temporary_security_credential',
  encrypted_data: 'security_identity_compliance/iam/encrypted_data',
  eni: 'networking_content_delivery/vpc/elastic_network_interface',
  event: 'management_governance/cloudwatch/event_event_based',
  interactive_video: 'general/multimedia',
  key: 'security_identity_compliance/iam/permissions',
  logs: 'management_governance/cloudwatch/logs',
  policy: 'security_identity_compliance/iam/add_on',
  role: 'security_identity_compliance/iam/role',
  rule: 'management_governance/cloudwatch/rule',
  scheduled_event: 'management_governance/cloudwatch/event_time_based',
  template: 'management_governance/cloudformation/template',
 } as const;

/** Generates `generated/assets.ts` and `ASSETS.md` files. */
export async function generate () {
  await fs.ensureDir(ASSET_PACKAGE_DIR);
  await fs.emptyDir(ASSET_PACKAGE_DIR);
  await fs.ensureDir(path.dirname(AWS_ASSETS_TS));

  const assetFiles: string[] = [];

  // copy static assets
  const groups = new Set<[string, string]>();
  for(const staticFile of await listDirFiles(path.join(STATIC_ASSETS))) {
    if (staticFile.match(/\/groups\/\w+\.(png|svg)/)) {
      // TODO: support svg groups - need to find the assets
      const group = path.basename(staticFile).split('.')[0];
      group !== "" && groups.add([group, `groups/${group}`]);
    }
    assetFiles.push(staticFile.replace(STATIC_ASSETS + '/', ''));
  }
  await fs.copy(STATIC_ASSETS, ASSET_PACKAGE_DIR, { overwrite: true });

  const downloadPath = path.join(TMP_DIR, ASSET_PACKAGE_ZIP_FILENAME);

  if (!await fs.pathExists(downloadPath)) {
    const response = await fetch(ASSET_PACKAGE_ZIP_URL);
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
    await util.promisify(stream.pipeline)(response.body, fs.createWriteStream(downloadPath))
  }

  const fullNameLookup: {[key: string]: string} = {};

  const categories = new Set<[string, string]>();
  const services = new Set<[string, string]>();
  const resources = new Set<[string, string]>();
  const generalIcons = new Set<[string, string]>();
  const instanceTypes = new Set<[string, string]>();
  const rdsInstanceTypes = new Set<[string, string]>();
  const iotThings = new Set<[string, string]>();

  // Unzip all .svg files (png resources are low-res of 48px only, so we generate them from svg)
  const zip = fs.createReadStream(downloadPath).pipe(ZipParse());
  // async for...of causes premature close in node 18+
  // https://github.com/ZJONSSON/node-unzipper/issues/228#issuecomment-1294451911
  await zip.on("entry", (entry) => {
    const entryPath: string = patchZipEntryPath(entry.path);
    let fileName = path.basename(entryPath);
    const ext = path.extname(fileName);
    const type = entry.type; // 'Directory' or 'File'

    let extract = false;

    if (type === 'File' && !fileName.startsWith('.')) {
      if (entryPath.match(ASSET_PATTERNS.RDS_INSTANCE)) {
        let { category, instanceType, alt, theme } = entryPath.match(ASSET_PATTERNS.RDS_INSTANCE)!.groups! as { category: string, theme: string, instanceType: string, alt?: string };
        category = findAwsCategoryDefinition(normalizeIdentifier(category)).id;
        instanceType = normalizeIdentifier(instanceType);
        theme = normalizeIdentifier(theme);
        const serviceName = resolveServiceName("rds");

        // All db asset icons start with some variation of "Amazon-Aurora" prefix, even though they do not belong under Aurora
        // Example: Res_Amazon-Aurora-Oracle-Instance_48_Light, Res_Amazon-Aurora-Oracle-Instance_48_Light
        if (instanceType === "rds") {
          instanceType = "instance";
        } else if (instanceType !== "aurora") {
          // only treat the actual "aurora" type as aurora and all others as "rds" types
          instanceType = instanceType.replace("aurora_", "");
          instanceType = instanceType.replace("rds_", "");
          // squash value to align with resource engine values (eg: sql_server => sqlserver)
          // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbinstance.html#cfn-rds-dbinstance-engine
          instanceType = instanceType.replace("_", "");
        }

        if (alt) {
          instanceType += "_alt"
        }

        let key: string;

        // Treat default RDS instance as resource of rds, rather than an instance type
        if (instanceType === "instance" || instanceType === "instance_alt") {
          key = path.join(category, serviceName, instanceType);

          if (!alt && theme === DEFAULT_THEME) {
            resources.add(["rds_instance", key]);
            fullNameLookup["rds_instance"] = "RDS Instance";
          }
        } else {
          key = path.join(category, serviceName, "instance", instanceType);

          if (theme === DEFAULT_THEME) {
            rdsInstanceTypes.add([instanceType, key]);
          }
        }
        if (theme !== DEFAULT_THEME) {
          key += `.${theme}`;
        }

        fileName = key + ext;
        extract = true;
      } else if (entryPath.match(ASSET_PATTERNS.RESOURCE)) {
        let { category, serviceName, resourceName, theme } = entryPath.match(ASSET_PATTERNS.RESOURCE)!.groups! as { category: string, serviceName: string, theme: string, resourceName: string };
        const serviceFullName = interpolateFullName(serviceName);
        const resourceFullName = interpolateFullName(resourceName);
        category = findAwsCategoryDefinition(normalizeIdentifier(category)).id;
        serviceName = resolveServiceName(serviceName);
        resourceName = normalizeIdentifier(resourceName);
        theme = normalizeIdentifier(theme);

        let key = path.join(category, serviceName, resourceName);
        let nestedResource = false;
        if (key.match(EC2_INSTANCE_PATTERN)) {
          const { instanceType } = key.match(EC2_INSTANCE_PATTERN)!.groups!;
          key = path.join(category, serviceName, 'instance', instanceType);
          instanceTypes.add([instanceType, key]);
          nestedResource = true;
        }
        if (key.match(IOT_THING_PATTERN)) {
          const { thingType } = key.match(IOT_THING_PATTERN)!.groups!;
          key = path.join(category, 'thing', thingType);
          iotThings.add([thingType, key]);
          nestedResource = true;
        }

        if (theme === DEFAULT_THEME) {
          if (!nestedResource) {
            if (resourceName === 'service') {
              services.add([serviceName, key]);
              fullNameLookup[serviceName] = serviceFullName;
            }
            resourceName = `${serviceName}_${resourceName}`;
            resources.add([resourceName, key]);
            fullNameLookup[resourceName] = resourceFullName;
          }
        } else {
          key += `.${theme}`;
        }
        fileName = key + ext;
        extract = true;
      } else if (entryPath.match(ASSET_PATTERNS.SERVICE)) {
        let { category, serviceName } = entryPath.match(ASSET_PATTERNS.SERVICE)!.groups! as { category: string, serviceName: string };
        const serviceFullName = interpolateFullName(serviceName);
        serviceName = resolveServiceName(serviceName);
        category = findAwsCategoryDefinition(normalizeIdentifier(category)).id;

        const key = path.join(category, serviceName, SERVICE_ICON);
        fileName = key + ext;
        extract = true;
        services.add([serviceName, key]);
        fullNameLookup[serviceName] = serviceFullName;
      } else if (entryPath.match(ASSET_PATTERNS.CATEGORY)) {
        let { category } = entryPath.match(ASSET_PATTERNS.CATEGORY)!.groups! as { category: string };
        const categoryFullName = interpolateFullName(category);
        category = normalizeIdentifier(category);

        const key = path.join(category, CATEGORY_ICON);
        fileName = key + ext;
        extract = true;
        categories.add([category, key]);
        fullNameLookup[category] = categoryFullName;
      } else if (entryPath.match(ASSET_PATTERNS.GENERAL)) {
        let { theme, generalIcon } = entryPath.match(ASSET_PATTERNS.GENERAL)!.groups! as { theme: string, generalIcon: string };
        theme = normalizeIdentifier(theme);
        generalIcon = normalizeIdentifier(generalIcon);

        let key = path.join(GENERAL_CATEGORY_ID, generalIcon);
        if (theme === DEFAULT_THEME) {
          generalIcons.add([generalIcon, key]);
        } else {
          key += `.${theme}`;
        }
        fileName = key + ext;
        extract = true;
      } else if (entryPath.includes("_64") && entryPath.endsWith(".svg")) {
        throw new Error(`Failed to match expected path: ${entryPath}`);
      }
    }

    if (extract) {
      const filePath = path.join(ASSET_PACKAGE_DIR, fileName);
      assetFiles.push(fileName);
      fs.ensureDirSync(path.dirname(filePath));
      if (fs.pathExistsSync(filePath)) {
        console.debug(entryPath)
        throw new Error(`Asset path arealdy exists: ${filePath}`)
      }
      entry.pipe(fs.createWriteStream(filePath));
    } else {
      entry.autodrain();
    }
  }).promise();

  // some dark instance types do not have "-Instance" prefix, so need to move them
  const computeEC2Dir = path.join(ASSET_PACKAGE_DIR, 'compute', 'ec2');
  const instanceDir = path.join(computeEC2Dir, 'instance');
  const instanceTypeNames = new Set<string>(Array.from(instanceTypes).map(([key]) => key));
  const resolvedInstanceTypes: string[] = [];
  for(const _ec2File of (await listDirFiles(computeEC2Dir, false))) {
    const _basename = path.basename(_ec2File);
    if (instanceTypeNames.has(_basename.split(".")[0])) {
      resolvedInstanceTypes.push(_basename)
      await fs.move(_ec2File, path.join(instanceDir, _basename))
    }
  }
  console.debug("Resolved instance icons:", resolvedInstanceTypes.join(', '));

  // create png for all svg assets (that don't already have png)
  for(const svgFile of (await listDirFiles(ASSET_PACKAGE_DIR)).filter(filePath => path.extname(filePath) === EXT_SVG)) {
    const pngFile = svgFile.replace(EXT_SVG, EXT_PNG);
    if (!(await fs.pathExists(pngFile))) {
      await sharp(svgFile).resize({
        width: PNG_ASSET_SIZE,
        height: PNG_ASSET_SIZE,
        background: {r:1,g:1,b:1,alpha:0}, // transparent
        fit: 'contain',
      }).toFormat('png').toFile(pngFile);
      assetFiles.push(path.relative(ASSET_PACKAGE_DIR, pngFile));
    }
  }

  const aliasable: Set<string> = new Set<string>([
    ...Array.from(resources.values()).map(([_k,_v]) => _v),
    ...Array.from(generalIcons.values()).map(([_k,_v]) => _v),
  ])
  for (const [alias, assetKey] of Object.entries(GENERAL_ALIASES)) {
    if (!aliasable.has(assetKey)) {
      throw new Error(`Invalid general alias: ${alias} => ${assetKey}`)
    }
    generalIcons.add([alias, assetKey]);
  }

  assetFiles.sort();

  /** eslint-disable */
  await fs.writeFile(AWS_ASSETS_TS, `// AUTO-GENERATED - DO NOT EDIT
/* eslint-disable */
export namespace AwsAsset {
  export const Categories = ${JSON.stringify(sortedObjectFromEntries(categories), null, 4)} as const;

  export type Category = keyof typeof Categories;

  export const Services = ${JSON.stringify(sortedObjectFromEntries(services), null, 4)} as const;

  export type Service = keyof typeof Services;

  export const Resources = ${JSON.stringify(sortedObjectFromEntries(resources), null, 4)} as const;

  export type Resource = keyof typeof Resources;

  export const InstanceTypes = ${JSON.stringify(sortedObjectFromEntries(instanceTypes), null, 4)} as const;

  export type InstanceType = keyof typeof InstanceTypes;

  export const RdsInstanceTypes = ${JSON.stringify(sortedObjectFromEntries(rdsInstanceTypes), null, 4)} as const;

  export type RdsInstanceType = keyof typeof RdsInstanceTypes;

  export const IotThings = ${JSON.stringify(sortedObjectFromEntries(iotThings), null, 4)} as const;

  export type IotThing  = keyof typeof IotThings;

  export const GeneralIcons = ${JSON.stringify(sortedObjectFromEntries(generalIcons), null, 4)} as const;

  export type GeneralIcon = keyof typeof GeneralIcons;

  export const Groups = ${JSON.stringify(sortedObjectFromEntries(groups), null, 4)} as const;

  export type Group = keyof typeof Groups;

  export const AssetFullNameLookup = ${JSON.stringify(sortedObjectFromEntries(fullNameLookup), null, 4)} as const;

  /**
   * Static list of all avaliable asset files - stored as const to prevent async io at runtime
   * @internal
   **/
  export const AssetFiles = new Set<string>(${JSON.stringify(assetFiles, null, 4)});
}
`)

  const assetTree = (await tree({ base: path.relative(process.cwd(), ASSET_PACKAGE_DIR), l: 10, f: true })).report.replace(/\S+/, '/');

  await fs.writeFile(ASSETS_MARKDOWN, `<!-- AUTO-GENERATED - DO NOT EDIT -->
## AWS Architecture Icons

This package generates a normalized asset dictionary from [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/).

Asset paths follow \`<category>/<service>/<resource>[.<theme>].<ext>\` structure.

> eg: storage/s3/bucket.png, storage/s3/bucket.dark.png

**Category** icons follow \`<category>/category_icon.<ext>\` structure.

> eg: storage/category_icon.png

**Service** icons follow \`<category>/<service>/service_icon.<ext>\` structure.

> eg: storage/s3/service_icon.png

The _default theme_ is **light**.

---

### Available assets

\`\`\`
${assetTree}
\`\`\`

`)
  /** eslint-enable */
};

function sortedObjectFromEntries(entries: [string, string][] | Set<[string, string]> | {[key: string]: any}): { [key: string]: string } {
  if (entries instanceof Set) {
    entries = Array.from(entries);
  }else if (!Array.isArray(entries)) {
    entries = Object.entries(entries);
  }

  return Object.fromEntries(entries.sort((a: [string, string], b: [string, string]) => {
    const _a = a[0]
    const _b = b[0]
    if (_a === _b) return 0;
    if (_a < _b) return -1;
    return 1;
  }))
}

const SERVICE_NAME_LOOKUP: {[key: string]: string} = Object.fromEntries(Object.entries(NORMALIZED_SERVICE_VARIANTS).flatMap(([key, variants]) => {
  return (variants || []).map((variant) => [variant, key]);
}))

function resolveServiceName(value: string): string {
  value = normalizeIdentifier(value);
  // Kinesis is referenced as service and family, generally kinesis as "service" maps to "kinesis data stream" however for asset
  // resolution of value we want "kinesis" as family not direct service, so need to ignore service variant mapping for asset case.
  if (['kinesis'].includes(value)) {
    return value;
  }
  return SERVICE_NAME_LOOKUP[value] || value;
}

function patchZipEntryPath (entryPath: string): string {
  // there are some non _ delimited asset names
  entryPath = entryPath.replace(/(App-Mesh|Cloud-Map|Direct-Connect|Route-53)-/g, '$1_')
  // s3_glacier mismatched resource names
  entryPath = entryPath.replace('Simple-Storage-Service_S3-Glacier-', 'Simple-Storage-Service-Glacier_')

  return entryPath;
}

function interpolateFullName(value: string): string {
  value = value.replace(/[-_]+/g, ' ');
  value = value.replace('1 Click', '1-Click');
  value = value.replace('X Ray', 'X-Ray');
  return value;
}

if (require.main === module) {
  generate();
}
