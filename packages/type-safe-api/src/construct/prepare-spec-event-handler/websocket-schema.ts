/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import type { OpenAPIV3 } from "openapi-types";
import { HttpMethods } from "./constants";
import { validatePathItem } from "./prepare-spec";

type SchemaDefinitions = { [key: string]: OpenAPIV3.SchemaObject };
export type ApiGatewaySchemaWithRefs = {
  schema: OpenAPIV3.SchemaObject;
  definitions: SchemaDefinitions;
};

const _get = (object: any | undefined, paths: string[]): any => {
  if (typeof object === "undefined") {
    return undefined;
  }
  if (paths.length === 0) {
    return object;
  }
  return _get(object[paths[0]], paths.slice(1));
};

/**
 * Return whether or not the given OpenAPI object is a reference
 */
const isRef = (obj: unknown): obj is OpenAPIV3.ReferenceObject =>
  !!obj && typeof obj === "object" && "$ref" in obj;

/**
 * Return whether a given OpenAPI object is a schema object
 */
const isSchemaObj = (obj: unknown): obj is OpenAPIV3.SchemaObject =>
  !!obj &&
  typeof obj === "object" &&
  ("type" in obj ||
    "allOf" in obj ||
    "oneOf" in obj ||
    "anyOf" in obj ||
    "not" in obj);

/**
 * Split a reference into its component parts
 * eg: #/components/schemas/Foo -> ["components", "schemas", "Foo"]
 */
const splitRef = (ref: string): string[] =>
  ref
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~0/g, "~").replace(/~1/g, "/"));

/**
 * Resolve the given reference in the spec
 */
const resolveRef = (spec: OpenAPIV3.Document, ref: string): any => {
  const refParts = splitRef(ref);
  const resolved = _get(spec, refParts);
  if (!resolved) {
    throw new Error(`Unable to resolve ref ${ref} in spec`);
  }
  return resolved;
};

/**
 * Get the id of a reference to be used in the "definitions" section
 */
const getRefId = (ref: string) => splitRef(ref).join("_");

/**
 * Rewrite a reference to an API gateway model supported format
 * eg #/components/schemas/Foo -> #/definitions/components_schemas_Foo
 */
const rewriteRef = (ref: string) => `#/definitions/${getRefId(ref)}`;

/**
 * Map the given function over all refs in an OpenAPI object
 */
const mapRefs = <T>(obj: object, fn: (ref: string) => T): object => {
  // Use JSON.stringify's replacement function to simplify traversing a spec
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (key === "$ref") {
        return fn(value);
      }
      return value;
    })
  );
};

/**
 * Find all references recursively starting at the given schema
 */
const findAllReferences = (
  schema: OpenAPIV3.SchemaObject,
  spec: OpenAPIV3.Document,
  seenRefs: Set<string> = new Set()
): Set<string> => {
  const newRefs = new Set<string>();
  mapRefs(schema, (ref) => newRefs.add(ref));
  const refsToSearch = [...newRefs].filter((ref) => !seenRefs.has(ref));
  const newSeenRefs = new Set([...newRefs, ...seenRefs]);
  return new Set([
    ...newSeenRefs,
    ...refsToSearch.flatMap((ref) => [
      ...findAllReferences(resolveRef(spec, ref), spec, newSeenRefs),
    ]),
  ]);
};

/**
 * Rewrite all references in the schema to instead reference #/definitions/xxx, and collect any other schemas recursively referenced by the schema
 *
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/models-mappings-models.html#api-gateway-request-validation-model-more-complex
 */
const rewriteSchemaReferences = (
  schema: OpenAPIV3.SchemaObject,
  spec: OpenAPIV3.Document
): ApiGatewaySchemaWithRefs => {
  // Rewrite the schema and spec, replacing references with #/definitions/xxx as per the API Gateway model format
  const rewrittenSchema = mapRefs(schema, rewriteRef) as OpenAPIV3.SchemaObject;
  const rewrittenSpec = mapRefs(spec, rewriteRef) as OpenAPIV3.Document;

  // Set of definitions that must be included for the given schema
  const definitions: SchemaDefinitions = {};

  // Find all recursive references from the schema, and add their (rewritten) schema to definitions
  [...findAllReferences(schema, spec)].forEach((ref) => {
    definitions[getRefId(ref)] = resolveRef(rewrittenSpec, ref);
  });

  return { schema: rewrittenSchema, definitions };
};

export const extractWebSocketSchema = (
  operationId: string,
  requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject,
  spec: OpenAPIV3.Document
): ApiGatewaySchemaWithRefs | undefined => {
  // Resolve the body reference, if any
  const body = isRef(requestBody)
    ? (resolveRef(spec, requestBody.$ref) as OpenAPIV3.RequestBodyObject)
    : requestBody;
  const candidateSchema = body?.content?.["application/json"]?.schema;
  if (!candidateSchema) {
    // No schema found
    return undefined;
  }

  // Resolve the top level schema reference, if any
  const rawSchema = isRef(candidateSchema)
    ? (resolveRef(spec, candidateSchema.$ref) as OpenAPIV3.SchemaObject)
    : candidateSchema;

  if (!isSchemaObj(rawSchema)) {
    throw new Error(
      `Invalid OpenAPI specification: request body for operation ${operationId} is not a valid schema`
    );
  }

  // Rewrite schema references to a format accepted by API Gateway
  return rewriteSchemaReferences(rawSchema, spec);
};

export const extractWebSocketSchemas = (
  operationIds: string[],
  serverOperationPaths: { [operationId: string]: string },
  spec: OpenAPIV3.Document
): { [operationId: string]: ApiGatewaySchemaWithRefs } => {
  const schemasByOperationId: {
    [operationId: string]: ApiGatewaySchemaWithRefs;
  } = {};
  for (const operationId of operationIds) {
    const path = serverOperationPaths[operationId];
    const pathItem = spec.paths[path]!;
    validatePathItem(path, pathItem);

    // Exactly 1 operation must be defined for each path in a websocket OpenAPI spec
    const operations = Object.values(HttpMethods).flatMap((method) =>
      pathItem[method] ? [{ ...pathItem[method], method }] : []
    );

    if (operations.length !== 1) {
      throw new Error(
        `Each path must have a single method for websocket apis. Found ${
          operations.map((o) => o.method).join(", ") || "no methods"
        }`
      );
    }

    // Extract the schema for the websocket input validation model
    if (operations[0]?.requestBody) {
      const schema = extractWebSocketSchema(
        operationId,
        operations[0].requestBody,
        spec
      );
      if (schema) {
        schemasByOperationId[operationId] = schema;
      }
    }
  }
  return schemasByOperationId;
};
