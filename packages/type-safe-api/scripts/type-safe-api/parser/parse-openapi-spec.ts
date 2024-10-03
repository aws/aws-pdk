/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import SwaggerParser from "@apidevtools/swagger-parser";
import { writeFile } from "projen/lib/util";
import { parse } from "ts-command-line-args";
import fs from "fs";

// Smithy HTTP trait is used to map Smithy operations to their location in the spec
const SMITHY_HTTP_TRAIT_ID = "smithy.api#http";

// The OpenAPI vendor extension used for paginated operations
const PAGINATED_VENDOR_EXTENSION = "x-paginated";

// Traits that will "rename" members in the generated OpenAPI spec
const SMITHY_RENAME_TRAITS = [
  "smithy.api#httpQuery",
  "smithy.api#httpHeader",
];

// Maps fully qualified traits to specific vendor extensions which we also support specifying in OpenAPI
const FULLY_QUALIFIED_TRAIT_TO_SUPPORTED_OPENAPI_VENDOR_EXTENSION: { [key: string]: string } = {
  "smithy.api#paginated": PAGINATED_VENDOR_EXTENSION,
};

// Maps trait names to vendor extensions which we also support specifying in OpenAPI
const TRAIT_NAME_TO_SUPPORTED_OPENAPI_VENDOR_EXTENSION: { [key: string]: string } = {
  "handler": "x-handler",
  "async": "x-async",
  "connectHandler": "x-connect-handler",
  "disconnectHandler": "x-disconnect-handler",
};

interface SmithyMember {
  readonly target: string;
  readonly traits?: { [key: string]: any };
}

interface SmithyOperationInput {
  readonly type: string;
  readonly members?: { [key: string]: SmithyMember }
}

interface SmithyOperationDetails {
  readonly id: string;
  readonly method: string;
  readonly path: string;
  readonly traits: { [key: string]: any };
  readonly input?: SmithyOperationInput;
}

interface SmithyServiceDetails {
  readonly id: string;
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

const getVendorExtensionFromTrait = (traitId: string): string => {
  const [, name] = traitId.split('#');

  // By default, we use x-<fully_qualified_trait_id> for the vendor extension, but for extensions we support
  // directly from OpenAPI we apply a mapping (rather than repeat ourselves in the mustache templates).
  return FULLY_QUALIFIED_TRAIT_TO_SUPPORTED_OPENAPI_VENDOR_EXTENSION[traitId]
    ?? TRAIT_NAME_TO_SUPPORTED_OPENAPI_VENDOR_EXTENSION[name]
    ?? `x-${traitId}`;
};

export default async (argv: string[]) => {
  const args = parse<Arguments>({
    specPath: { type: String, alias: "s" },
    smithyJsonPath: { type: String, optional: true },
    outputPath: { type: String, alias: "o" },
  }, { argv });

  const spec = (await SwaggerParser.bundle(args.specPath)) as any;

  if (args.smithyJsonPath) {
    // Read the operations out of the Smithy model
    const smithyModel = JSON.parse(
      fs.readFileSync(args.smithyJsonPath, "utf-8")
    );

    // Retrieve all services from the smithy model
    const services: SmithyServiceDetails[] = Object.entries(smithyModel.shapes).filter(([, shape]: [string, any]) =>
      shape.type === "service" && shape.traits).map(([id, shape]: [string, any]) => ({
        id,
        traits: shape.traits,
      }));

    // Apply all service-level traits as vendor extensions at the top level of the spec
    services.forEach((service) => {
      Object.entries(service.traits).forEach(([traitId, value]) => {
        const vendorExtension = getVendorExtensionFromTrait(traitId);
        spec[vendorExtension] = value;
      });
    });

    // Retrieve all operations from the smithy model
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
        input: smithyModel.shapes[shape.input?.target],
      }));

    // Apply all operation-level traits as vendor extensions to the relevant operation in the spec
    operations.forEach((operation) => {
      if (spec.paths?.[operation.path]?.[operation.method]) {
        Object.entries(operation.traits).forEach(([traitId, value]) => {
          const vendorExtension = getVendorExtensionFromTrait(traitId);

          let extensionValue = value;

          // The smithy paginated trait is written in terms of inputs which may have different names in openapi
          // so we must map them here
          if (vendorExtension === PAGINATED_VENDOR_EXTENSION) {
            extensionValue = Object.fromEntries(Object.entries(value as {[key: string]: string}).map(([traitProperty, memberName]) => {
              const member = operation.input?.members?.[memberName];
              const renamedMemberName = SMITHY_RENAME_TRAITS.map(trait => member?.traits?.[trait]).find(x => x) ?? memberName;
              return [traitProperty, renamedMemberName];
            }));
          }

          spec.paths[operation.path][operation.method][vendorExtension] = extensionValue;
        });
      }
    });
  }

  const invalidRequestParameters: InvalidRequestParameter[] = [];

  // Dereference a clone of the spec to test parameters
  const dereferencedSpec = await SwaggerParser.dereference(JSON.parse(JSON.stringify(spec)), {
    dereference: {
      // Circular references are valid, we just ignore them for the purpose of validation
      circular: "ignore",
    },
  });

  // Validate the request parameters
  Object.entries(dereferencedSpec.paths || {}).forEach(([p, pathOp]: [string, any]) => {
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
};
