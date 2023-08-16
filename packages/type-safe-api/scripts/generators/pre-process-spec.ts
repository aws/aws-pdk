/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import SwaggerParser from "@apidevtools/swagger-parser";
import { parse } from "ts-command-line-args";

// Smithy HTTP trait is used to map Smithy operations to their location in the spec
const SMITHY_HTTP_TRAIT_ID = "smithy.api#http";

// Maps traits to specific vendor extensions which we also support specifying in OpenAPI
const TRAIT_TO_SUPPORTED_OPENAPI_VENDOR_EXTENSION: { [key: string]: string } = {
  "smithy.api#paginated": "x-paginated",
};

interface Arguments {
  /**
   * Path to the spec to preprocess
   */
  readonly specPath: string;
  /**
   * Path to the smithy json model
   */
  readonly smithyJsonPath?: string;
  /**
   * JSON string containing extra vendor extensions to add to the spec
   */
  readonly extraVendorExtensions?: string;
  /**
   * Location to write the preprocessed spec to
   */
  readonly outputSpecPath: string;
}

interface SmithyOperationDetails {
  readonly id: string;
  readonly method: string;
  readonly path: string;
  readonly traits: { [key: string]: any };
}

void (async () => {
  const args = parse<Arguments>({
    specPath: { type: String },
    smithyJsonPath: { type: String, optional: true },
    extraVendorExtensions: { type: String, optional: true },
    outputSpecPath: { type: String },
  });

  const spec = (await SwaggerParser.bundle(args.specPath)) as any;

  if (args.smithyJsonPath) {
    // Read the operations out of the Smithy model
    const smithyModel = JSON.parse(
      fs.readFileSync(args.smithyJsonPath, "utf-8")
    );
    const operations: SmithyOperationDetails[] = Object.entries(
      smithyModel.shapes
    )
      .filter(
        ([, shape]: [string, any]) =>
          shape.type === "operation" &&
          shape.traits &&
          SMITHY_HTTP_TRAIT_ID in shape.traits
      )
      .map(([id, shape]: [string, any]) => ({
        id,
        method: shape.traits[SMITHY_HTTP_TRAIT_ID].method?.toLowerCase(),
        path: shape.traits[SMITHY_HTTP_TRAIT_ID].uri,
        traits: shape.traits,
      }));

    // Apply all operation-level traits as vendor extensions to the relevant operation in the spec
    operations.forEach((operation) => {
      if (spec.paths?.[operation.path]?.[operation.method]) {
        Object.entries(operation.traits).forEach(([traitId, value]) => {
          // By default, we use x-<fully_qualified_trait_id> for the vendor extension, but for extensions we support
          // directly from OpenAPI we apply a mapping (rather than repeat ourselves in the mustache templates).
          let vendorExtension =
            TRAIT_TO_SUPPORTED_OPENAPI_VENDOR_EXTENSION[traitId] ??
            `x-${traitId}`;
          // Special case for the handler trait where it's defined as part of the user's smithy model, so the namespace
          // can be any namespace the user defines
          if (traitId.endsWith("#handler")) {
            vendorExtension = "x-handler";
          }
          spec.paths[operation.path][operation.method][vendorExtension] = value;
        });
      }
    });
  }

  const processedSpec = {
    ...spec,
    ...JSON.parse(args.extraVendorExtensions || "{}"),
  };

  fs.writeFileSync(args.outputSpecPath, JSON.stringify(processedSpec, null, 2));
})();
