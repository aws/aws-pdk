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

const URL = 'https://d1qsjq9pzbk1k6.cloudfront.net/manifest/en_US.json';

const FILEPATH = path.join(__dirname, '..', '..', 'static', 'aws-pricing-manifest.json');

(async () => {
  console.info('Fetching pricing manifest...');
  const response = await fetch(URL);
  if (!response.ok) {
    console.debug(response);
    throw new Error(`Failed to download pricing manifest: ${response.statusText} - ${response.statusText}`);
  }
  await util.promisify(stream.pipeline)(response.body, fs.createWriteStream(FILEPATH));
  console.info('Done - pricing manifest fetched')
})();
