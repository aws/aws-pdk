/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import SwaggerParser from "@apidevtools/swagger-parser";
import { parse } from "ts-command-line-args";


interface Arguments {
  /**
   * Path to the spec to preprocess
   */
  readonly specPath: string;
  /**
   * JSON string containing extra vendor extensions to add to the spec
   */
  readonly extraVendorExtensions?: string;
  /**
   * Location to write the preprocessed spec to
   */
  readonly outputSpecPath: string;
}

void (async () => {
  const args = parse<Arguments>({
    specPath: { type: String },
    extraVendorExtensions: { type: String, optional: true },
    outputSpecPath: { type: String },
  });

  const spec = (await SwaggerParser.bundle(args.specPath)) as any;

  Object.entries(spec?.paths ?? {}).forEach(([_path, methods]) => Object.entries(methods ?? {}).forEach(([_method, operation]) => {
    // Add helper vendor extensions to make code generation easier for async operations
    if (operation?.["x-async"]) {
      if (["client_to_server", "bidirectional"].includes(operation?.['x-async']?.direction)) {
        operation["x-async-to-server"] = true;
      }
      if (["server_to_client", "bidirectional"].includes(operation?.['x-async']?.direction)) {
        operation["x-async-to-client"] = true;
      }
    }
  }));

  const processedSpec = {
    ...spec,
    ...JSON.parse(args.extraVendorExtensions || "{}"),
  };

  fs.writeFileSync(args.outputSpecPath, JSON.stringify(processedSpec, null, 2));
})();
