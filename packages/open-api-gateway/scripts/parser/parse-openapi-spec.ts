// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SwaggerParser from "@apidevtools/swagger-parser";
import { parse } from 'ts-command-line-args';
import {PROJEN_MARKER} from "projen/lib/common";
import {writeFile} from "projen/lib/util";

interface Arguments {
  readonly specPath: string;
  readonly outputPath: string;
}

(async () => {
  const args = parse<Arguments>({
    specPath: { type: String, alias: 's' },
    outputPath: { type: String, alias: 'o' },
  });
  console.log('Parsing spec', args.specPath);

  const parsedSpec = await SwaggerParser.parse(args.specPath);

  writeFile(args.outputPath, JSON.stringify({
    ...parsedSpec,
    // Include the marker to indicate this is a generated file
    '//': PROJEN_MARKER,
  }, null, 2), {
    readonly: true,
  });

  console.log('Written parsed spec to', args.outputPath);
})();
