/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import SwaggerParser from "@apidevtools/swagger-parser";
import { writeFile } from "projen/lib/util";
import { parse } from "ts-command-line-args";
import * as path from 'path';

/**
 * Arguments for parsing an OpenAPI spec file
 */
interface Arguments {
  /**
   * Path to the input OpenAPI specification file (spec.yaml). Must be the root spec if using references to other specs.
   */
  readonly specPath: string;
  /**
   * Path to write the output json specification file to
   */
  readonly outputPath: string;
}

void (async () => {
  const args = parse<Arguments>({
    specPath: { type: String, alias: "s" },
    outputPath: { type: String, alias: "o" },
  });

  const parsedSpec = await SwaggerParser.bundle(args.specPath);

  writeFile(args.outputPath, JSON.stringify(parsedSpec, null, 2), {
    readonly: true,
  });
})();
