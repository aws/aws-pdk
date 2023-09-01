/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import SwaggerParser from "@apidevtools/swagger-parser";
import { writeFile } from "projen/lib/util";
import { parse } from "ts-command-line-args";
import * as path from 'path';
import fs from "fs";

// Smithy HTTP trait is used to map Smithy operations to their location in the spec
const SMITHY_HTTP_TRAIT_ID = "smithy.api#http";

// Maps traits to specific vendor extensions which we also support specifying in OpenAPI
const TRAIT_TO_SUPPORTED_OPENAPI_VENDOR_EXTENSION: { [key: string]: string } = {
  "smithy.api#paginated": "x-paginated",
};

interface SmithyOperationDetails {
  readonly id: string;
  readonly method: string;
  readonly path: string;
  readonly traits: { [key: string]: any };
}

interface InvalidRequestParameter {
  readonly operationId?: string;
  readonly method: string;
  readonly path: string;
  readonly parameterName?: string;
}

// Permitted types for request parameters
const VALID_REQUEST_PARAMETER_TYPES = new Set(["number", "integer", "boolean", "string"]);

/**
 * Arguments for parsing an OpenAPI spec file
 */
interface Arguments {
  /**
   * Path to the input OpenAPI specification file (spec.yaml). Must be the root spec if using references to other specs.
   */
  readonly specPath: string;
  /**
   * Path to the smithy json model
   */
  readonly smithyJsonPath?: string;
  /**
   * Path to write the output json specification file to
   */
  readonly outputPath: string;
}

void (async () => {
  const args = parse<Arguments>({
    specPath: { type: String, alias: "s" },
    smithyJsonPath: { type: String, optional: true },
    outputPath: { type: String, alias: "o" },
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

  const invalidRequestParameters: InvalidRequestParameter[] = [];

  // Validate the request parameters
  Object.entries(spec.paths || {}).forEach(([p, pathOp]: [string, any]) => {
    Object.entries(pathOp ?? {}).forEach(([method, operation]: [string, any]) => {
      (operation?.parameters ?? []).forEach((parameter: any) => {
        // Check if the parameter is an allowed type
        if (VALID_REQUEST_PARAMETER_TYPES.has(parameter?.schema?.type)) {
          return;
        }
        // Check if the parameter is an array of the allowed type
        if ("array" === parameter?.schema?.type && VALID_REQUEST_PARAMETER_TYPES.has(parameter?.schema?.items?.type)) {
          return;
        }

        // Parameter is invalid
        invalidRequestParameters.push({
          method,
          path: p,
          operationId: parameter?.operationId,
          parameterName: parameter?.name,
        });
      });
    });
  });

  if (invalidRequestParameters.length > 0) {
    const parameterErrors = invalidRequestParameters.map((p) => `${p.operationId ?? `${p.method} ${p.path}`}: ${p.parameterName}`).join('\n');
    console.error(`Request parameters must be of type ${[...VALID_REQUEST_PARAMETER_TYPES].join(', ')} or arrays of these. Found invalid parameters:\n${parameterErrors}`);
    process.exit(1);
  }

  writeFile(args.outputPath, JSON.stringify(spec, null, 2), {
    readonly: true,
  });
})();
