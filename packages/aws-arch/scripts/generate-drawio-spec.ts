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
import { TMP_DIR, GENERATED_DIR } from './common';
import xmlFlow = require('xml-flow'); // eslint-disable-line @typescript-eslint/no-require-imports

const DRAWIO_AWS4_STENCILS = 'https://raw.githubusercontent.com/jgraph/drawio/5e0079fb96102d8b272e4dfda435390d31377659/src/main/webapp/stencils/aws4.xml';

const DRAWIO_SPEC_TS = path.join(GENERATED_DIR, 'drawio-spec.ts');

/** Generates `generated/drawio-spec.ts */
export async function generate () {
  const xmlFilePath = path.join(TMP_DIR, 'drawio.aws4.xml');

  if (!await fs.pathExists(xmlFilePath)) {
    const response = await fetch(DRAWIO_AWS4_STENCILS);
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
    await util.promisify(stream.pipeline)(response.body, fs.createWriteStream(xmlFilePath))
  }

  const xmlFileStream = fs.createReadStream(xmlFilePath);
  const flowStream = xmlFlow(xmlFileStream);

  const shapeNames: string[] = [];
  flowStream.on("tag:shape", (shape: any) => {
    shapeNames.push(shape.$attrs.name.replace(/ /g, '_'))
  })

  flowStream.on("end", async () => {
		/* eslint-disable */
    await fs.writeFile(DRAWIO_SPEC_TS, `// AUTO-GENERATED - DO NOT EDIT
/* eslint-disable */
export namespace DrawioSpec {
  export namespace Aws4 {
    export enum ShapeNames {
      ${shapeNames.reduce((accum, v, i) => {
				if (i !== 0) accum += '      ';
        return accum + `${v.toUpperCase()} = "${v}",\n`
    }, '')}    };
	};
};
    `)
		/** eslint-enable **/
  })
};

if (require.main === module) {
  generate();
}
