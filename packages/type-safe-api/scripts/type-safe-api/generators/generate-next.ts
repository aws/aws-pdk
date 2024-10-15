/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import SwaggerParser from "@apidevtools/swagger-parser";
import { parse } from "ts-command-line-args";
import * as ejs from "ejs";
import * as path from "path";
import _get from "lodash/get";
import _set from "lodash/set";
import _trim from "lodash/trim";
import _upperFirst from "lodash/upperFirst";
import _camelCase from "lodash/camelCase";
import _snakeCase from "lodash/snakeCase";
import _kebabCase from "lodash/kebabCase";
import _orderBy from "lodash/orderBy";
import _uniq from "lodash/uniq";
import _uniqBy from "lodash/uniqBy";
import _isEqual from "lodash/isEqual";
import { OpenAPIV3 } from "openapi-types";
import * as parseOpenapi from "parse-openapi";
import { getOperationResponses } from "parse-openapi/dist/parser/getOperationResponses";
import { getOperationResponse } from "parse-openapi/dist/parser/getOperationResponse";

const TSAPI_WRITE_FILE_START = "###TSAPI_WRITE_FILE###";
const TSAPI_WRITE_FILE_END = "###/TSAPI_WRITE_FILE###";

const MANIFEST_FILE_PATH = ".tsapi-manifest";
const LEGACY_MANIFEST_FILE_PATH = ".openapi-generator/FILES";

interface Arguments {
  /**
   * Path to the OpenAPI spec
   */
  readonly specPath: string;

  /**
   * Directories for templates - names relative to the location of this script
   */
  readonly templateDirs: string[];

  /**
   * JSON string containing metadata
   */
  readonly metadata?: string;
  /**
   * Location to write the generated code to
   */
  readonly outputPath: string;
  /**
   * Print the data passed to the ejs templates
   */
  readonly printData?: boolean;
}

interface WriteFileConfig {
  readonly id?: string;
  readonly dir: string;
  readonly name: string;
  readonly ext: string;
  readonly overwrite?: boolean;
  readonly kebabCaseFileName?: boolean;
  /**
   * Generate conditionally based on whether we generated the file with the given id
   */
  readonly generateConditionallyId?: string;
}

interface SplitFile {
  readonly contents: string;
  readonly pathRelativeToOutputPath: string;
  readonly config: WriteFileConfig;
  readonly shouldWrite?: boolean;
}

/**
 * Return whether or not the given OpenAPI object is a reference
 */
const isRef = (obj: unknown): obj is OpenAPIV3.ReferenceObject =>
  !!obj && typeof obj === "object" && "$ref" in obj;

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
 * Resolve the given object in an openapi spec if it's a ref
 */
const resolveIfRef = <T>(spec: OpenAPIV3.Document, possibleRef: T | OpenAPIV3.ReferenceObject): T => {
  let resolved = possibleRef;
  if (isRef(possibleRef)) {
    resolved = resolveRef(spec, possibleRef.$ref);
  }
  return resolved as T;
};

/**
 * Copy vendor extensions from the first parameter to the second
 */
const copyVendorExtensions = (object: object, vendorExtensions: { [key: string]: any }) => {
  Object.entries(object ?? {}).forEach(([key, value]) => {
    if (key.startsWith('x-')) {
      vendorExtensions[key] = value;
    }
  });
};

/**
 * Clean up any generated code that already exists
 */
const cleanGeneratedCode = (outputPath: string) => {
  let manifestPath = path.resolve(outputPath, MANIFEST_FILE_PATH);
  const legacyManifestPath = path.resolve(outputPath, LEGACY_MANIFEST_FILE_PATH);

  // If upgrading from a previous version of PDK which uses openapi-generator, honour that manifest
  // to clean up old generated code
  if (!fs.existsSync(manifestPath) && fs.existsSync(legacyManifestPath)) {
    manifestPath = legacyManifestPath;
  }

  // If the manifest exists, delete the files it lists
  if (fs.existsSync(manifestPath)) {
    const previouslyGeneratedFiles = new Set(
      fs
        .readFileSync(manifestPath, { encoding: "utf-8" })
        .split("\n")
        .filter((x) => x)
    );
    previouslyGeneratedFiles.forEach((previouslyGeneratedFile) => {
      const filePath = path.resolve(outputPath, previouslyGeneratedFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
};

const splitAndWriteFiles = (renderedFileContents: string[], outputPath: string) => {
  const splitFiles: SplitFile[] = [];

  renderedFileContents.forEach(contents => contents.split(TSAPI_WRITE_FILE_START)
    .filter((t) => t.includes(TSAPI_WRITE_FILE_END))
    .forEach((destinationFileTemplate) => {
      // Split by the end template to receive the file path, and contents
      const [configString, newFileContents] =
        destinationFileTemplate.split(TSAPI_WRITE_FILE_END);
      const config = JSON.parse(configString) as WriteFileConfig;

      const newFileName = `${config.name}${config.ext}`;

      const newFilePath = path.join(
        config.dir,
        newFileName
      );

      splitFiles.push({
        contents: newFileContents,
        pathRelativeToOutputPath: newFilePath,
        shouldWrite: !fs.existsSync(newFilePath) || config.overwrite,
        config,
      });
    }));

  const splitFilesById: { [id: string]: SplitFile } = Object.fromEntries(splitFiles.filter((s) => s.config.id).map((s) => [s.config.id, s]));

  const generatedFilePaths: string[] = [];

  // Write the split files
  splitFiles.forEach(({ pathRelativeToOutputPath, config, contents, shouldWrite }) => {
    const newFilePath = path.join(outputPath, pathRelativeToOutputPath);

    const conditionalShouldWrite = splitFilesById[config.generateConditionallyId ?? '']?.shouldWrite ?? true;

    // Write to the instructed file path (relative to the src dir)
    if (shouldWrite && conditionalShouldWrite) {
      // Create it's containing directory if needed
      fs.mkdirSync(path.dirname(newFilePath), {
        recursive: true,
      });
      fs.writeFileSync(newFilePath, contents);

      // Overwritten files are added to the manifest so that they can be cleaned up
      // by clean-openapi-generated-code
      if (config.overwrite) {
        generatedFilePaths.push(pathRelativeToOutputPath);
      }
    }
  });

  // Write the manifest file
  fs.writeFileSync(path.resolve(outputPath, MANIFEST_FILE_PATH), generatedFilePaths.join('\n'));
};

// Model types which indicate it is composed (ie inherits/mixin's another schema)
const COMPOSED_SCHEMA_TYPES = new Set(["one-of", "any-of", "all-of"]);
const PRIMITIVE_TYPES = new Set(["string", "integer", "number", "boolean", "null", "any", "binary", "void"]);

/**
 * Mutates the given data to ensure composite models (ie allOf, oneOf, anyOf) have the necessary
 * properties for representing them in generated code. Adds `composedModels` and `composedPrimitives`
 * which contain the models and primitive types that each model is composed of.
 */
const ensureCompositeModels = (data: parseOpenapi.ParsedSpecification) => {
  const visited = new Set<parseOpenapi.Model>();
  data.models.forEach(model => mutateModelWithCompositeProperties(data, model, visited));
}

const mutateModelWithCompositeProperties = (data: parseOpenapi.ParsedSpecification, model: parseOpenapi.Model, visited: Set<parseOpenapi.Model>) => {
  if (COMPOSED_SCHEMA_TYPES.has(model.export) && !visited.has(model)) {
    visited.add(model);

    // Find the models/primitives which this is composed from
    const composedModelReferences = model.properties.filter(p => !p.name && p.export === "reference");
    const composedPrimitives = model.properties.filter(p => !p.name && p.export !== "reference");

    const modelsByName = Object.fromEntries(data.models.map(m => [m.name, m]));
    const composedModels = composedModelReferences.flatMap(r => modelsByName[r.type] ? [modelsByName[r.type]] : []);
    // Recursively resolve composed properties of properties, to ensure mixins for all-of include all recursive all-of properties
    composedModels.forEach(m => mutateModelWithCompositeProperties(data, m, visited));

    // For all-of models, we include all composed model properties.
    if (model.export === "all-of") {
      if (composedPrimitives.length > 0) {
        throw new Error(`Schema "${model.name}" defines allOf with non-object types. allOf may only compose object types in the OpenAPI specification.`);
      }
    }

    (model as any).composedModels = composedModels;
    (model as any).composedPrimitives = composedPrimitives;
  }
};

const toTypescriptPrimitive = (property: parseOpenapi.Model): string => {
  if (property.type === "string" && ["date", "date-time"].includes(property.format ?? '')) {
    return "Date";
  } else if (property.type === "binary") {
    return "Blob";
  }
  return property.type;
};

/**
 * Return the typescript type for the given model
 */
const toTypeScriptType = (property: parseOpenapi.Model): string => {
  switch (property.export) {
    case "generic":
    case "reference":
      return toTypescriptPrimitive(property);
    case "array":
      return `Array<${property.link ? toTypeScriptType(property.link) : property.type}>`;
    case "dictionary":
      return `{ [key: string]: ${property.link ? toTypeScriptType(property.link) : property.type}; }`;
    default:
      return property.type;
  }
};

const toJavaPrimitive = (property: parseOpenapi.Model): string => {
  if (property.type === "string" && ["date", "date-time"].includes(property.format ?? '')) {
    return "Date";
  } else if (property.type === "binary") {
    return "byte[]";
  } else if (property.type === "number") {
    switch(property.format) {
      case "int32":
        return "Integer";
      case "int64":
        return "BigInteger";
      case "float":
        return "Float";
      case "double":
        return "Double";
      default:
        break;
    }

    if ((property as any).openapiType === "integer") {
      return "Integer";
    }
    return "BigDecimal";
  } else if (property.type === "boolean") {
    return "Boolean";
  } else if (property.type === "string") {
    return "String";
  }
  return property.type;
};

const toJavaType = (property: parseOpenapi.Model): string => {
  switch (property.export) {
    case "generic":
    case "reference":
      return toJavaPrimitive(property);
    case "array":
      return `${property.uniqueItems ? 'Set' : 'List'}<${property.link ? toTypeScriptType(property.link) : property.type}>`;
    case "dictionary":
      return `Map<String, ${property.link ? toTypeScriptType(property.link) : property.type}>`;
    default:
      return property.type;
  }
};

const toPythonPrimitive = (property: parseOpenapi.Model): string => {
  if (property.type === "string" && property.format === "date") {
    return "date";
  } else if (property.type === "string" && property.format === "date-time") {
    return "datetime"
  } else if (property.type === "any") {
    return "object";
  } else if (property.type === "binary") {
    return "bytearray";
  } else if (property.type === "number") {
    if ((property as any).openapiType === "integer") {
      return "int";
    }

    switch(property.format) {
      case "int32":
      case "int64":
        return "int";
      case "float":
      case "double":
      default:
        return "float";
    }
  } else if (property.type === "boolean") {
    return "bool";
  } else if (property.type === "string") {
    return "str";
  }
  return property.type;
};

const toPythonType = (property: parseOpenapi.Model): string => {
  switch (property.export) {
    case "generic":
    case "reference":
      return toPythonPrimitive(property);
    case "array":
      return `List[${property.link ? toPythonType(property.link) : property.type}]`;
    case "dictionary":
      return `Dict[str, ${property.link ? toPythonType(property.link) : property.type}]`;
    default:
      return property.type;
  }
};

/**
 * Mutates the given model to add language specific types and names
 */
const mutateModelWithAdditionalTypes = (model: parseOpenapi.Model) => {
  // Trim any surrounding quotes from name
  model.name = _trim(model.name, `"'`);

  (model as any).typescriptName = model.name;
  (model as any).typescriptType = toTypeScriptType(model);
  (model as any).javaName = model.name;
  (model as any).javaType = toJavaType(model);
  (model as any).pythonName = _snakeCase(model.name);
  (model as any).pythonType = toPythonType(model);
  (model as any).isPrimitive = PRIMITIVE_TYPES.has(model.type);
};

const mutateWithOpenapiSchemaProperties = (spec: OpenAPIV3.Document, model: parseOpenapi.Model, schema: OpenAPIV3.SchemaObject, visited: Set<parseOpenapi.Model> = new Set()) => {
  (model as any).format = schema.format;
  (model as any).isInteger = schema.type === "integer";
  (model as any).isShort = schema.format === "int32";
  (model as any).isLong = schema.format === "int64";
  (model as any).deprecated = !!schema.deprecated;
  (model as any).openapiType = schema.type;
  (model as any).isNotSchema = !!schema.not;

  // Copy any schema vendor extensions
  (model as any).vendorExtensions = {};
  copyVendorExtensions(schema, (model as any).vendorExtensions);

  // Use our added vendor extension
  (model as any).isHoisted = !!(model as any).vendorExtensions?.['x-tsapi-hoisted'];

  mutateModelWithAdditionalTypes(model);

  visited.add(model);

  // Also apply to array items recursively
  if (model.export === "array" && model.link && 'items' in schema && schema.items && !visited.has(model.link)) {
    const subSchema = resolveIfRef(spec, schema.items);
    mutateWithOpenapiSchemaProperties(spec, model.link, subSchema, visited);
  }

  // Also apply to object properties recursively
  if (model.export === "dictionary" && model.link && 'additionalProperties' in schema && schema.additionalProperties && !visited.has(model.link)) {
    const subSchema = resolveIfRef(spec, schema.additionalProperties);
    // Additional properties can be "true" rather than a type
    if (subSchema !== true) {
      mutateWithOpenapiSchemaProperties(spec, model.link, subSchema, visited);
    }
  }
  model.properties.filter(p => !visited.has(p) && schema.properties?.[p.name]).forEach(property => {
    const subSchema = resolveIfRef(spec, schema.properties![property.name]);
    mutateWithOpenapiSchemaProperties(spec, property, subSchema, visited);
  });

  if (COMPOSED_SCHEMA_TYPES.has(model.export)) {
    model.properties.forEach((property, i) => {
      const subSchema = resolveIfRef(spec, schema[_camelCase(model.export)]?.[i]);
      if (subSchema) {
        mutateWithOpenapiSchemaProperties(spec, property, subSchema, visited);
      }
    });
  }
};

interface SubSchema {
  readonly nameParts: string[];
  readonly schema: OpenAPIV3.SchemaObject;
  readonly prop: string;
}

interface SubSchemaRef {
  readonly $ref: string;
  readonly name: string;
  readonly schema: OpenAPIV3.SchemaObject;
}

const isCompositeSchema = (schema: OpenAPIV3.SchemaObject) =>
  !!schema.allOf || !!schema.anyOf || !!schema.oneOf;

const hasSubSchemasToVisit = (schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): schema is OpenAPIV3.SchemaObject =>
  !!schema && !isRef(schema) && (["object", "array"].includes(schema.type as any) || isCompositeSchema(schema) || !!schema.not);

const filterInlineCompositeSchemas = (schemas: (OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject)[], nameParts: string[], namePartPrefix: string, prop: string): SubSchema[] => {
  let inlineSchemaIndex = 0;
  return schemas.flatMap((s, i) => {
    if (hasSubSchemasToVisit(s)) {
      const subSchema: SubSchema = { nameParts: [...nameParts, `${namePartPrefix}${inlineSchemaIndex === 0 ? '' : inlineSchemaIndex}`], schema: s, prop: `${prop}.[${i}]` };
      inlineSchemaIndex++;
      return [subSchema];
    }
    return [];
  });
}

const hoistInlineObjectSubSchemas = (nameParts: string[], schema: OpenAPIV3.SchemaObject): SubSchemaRef[] => {
  // Find all the inline subschemas we should visit
  const inlineSubSchemas: SubSchema[] = [
    ...(hasSubSchemasToVisit(schema.not) ? [{ nameParts: [...nameParts, 'Not'], schema: schema.not, prop: 'not' }] : []),
    ...(schema.anyOf ? filterInlineCompositeSchemas(schema.anyOf, nameParts, 'AnyOf', 'anyOf') : []),
    ...(schema.allOf ? filterInlineCompositeSchemas(schema.allOf, nameParts, 'AllOf', 'allOf') : []),
    ...(schema.oneOf ? filterInlineCompositeSchemas(schema.oneOf, nameParts, 'OneOf', 'oneOf') : []),
    ...('items' in schema && hasSubSchemasToVisit(schema.items) ? [{ nameParts: [...nameParts, 'Inner'], schema: schema.items, prop: 'items' }] : []),
    ...(Object.entries(schema.properties ?? {}).filter(([, s]) => hasSubSchemasToVisit(s)).map(([name, s]) => ({ nameParts: [...nameParts, name], schema: s as OpenAPIV3.SchemaObject, prop: `properties.${name}` }))),
    ...((typeof schema.additionalProperties !== "boolean" && hasSubSchemasToVisit(schema.additionalProperties)) ? [{ nameParts: [...nameParts, 'Value'], schema: schema.additionalProperties, prop: `additionalProperties` }] : []),
  ];

  // Hoist these recursively first (ie depth first search) so that we don't miss refs
  const recursiveRefs = inlineSubSchemas.flatMap((s) => hoistInlineObjectSubSchemas(s.nameParts, s.schema));

  // Clone the object subschemas to build the refs. Note that only objects with "properties" are hoisted as these are non-dictionary types
  const refs = inlineSubSchemas.filter(s => (s.schema.type === "object" && s.schema.properties) || isCompositeSchema(s.schema)).map(s => {
    const name = s.nameParts.map(_upperFirst).join('');
    const $ref = `#/components/schemas/${name}`;
    const ref = {
      $ref,
      name,
      schema: structuredClone({
        ...s.schema,
        "x-tsapi-hoisted": true,
      }),
    };

    // Replace each subschema with a ref in the spec
    _set(schema, s.prop, { $ref });

    return ref;
  });

  return [...refs, ...recursiveRefs];
};

const buildData = (inSpec: OpenAPIV3.Document, metadata: any) => {
  // Using openapi generator, we passed "KEEP_ONLY_FIRST_TAG_IN_OPERATION" to ensure we don't generate duplicate
  // handler wrappers where multiple tags are used.
  // In order for the new generator not to be breaking, we apply the same logic here, however this can be removed
  // in future since we have control to avoid the duplicate handlers while allowing an operation to be part of
  // multiple "services".
  let spec = JSON.parse(JSON.stringify(inSpec, (key, value) => {
    // Keep only the first tag where we find a tag
    if (key === "tags" && value && value.length > 0 && typeof value[0] === "string") {
      return [value[0]];
    }
    return value;
  })) as OpenAPIV3.Document;

  // Ensure spec has schemas set
  if (!spec?.components?.schemas) {
    spec.components = {
      ...spec.components,
    };
    spec.components.schemas = {
      ...spec.components.schemas,
    };
  }

  // "Hoist" inline response schemas
  Object.entries(spec.paths ?? {}).forEach(([path, pathOps]) => Object.entries(pathOps ?? {}).forEach(([method, op]) => {
    const operation = resolveIfRef(spec, op);
    if (operation && typeof operation === "object" && "responses" in operation) {
      Object.entries(operation.responses ?? {}).forEach(([code, res]) => {
        const response = resolveIfRef(spec, res);
        const jsonResponseSchema = response?.content?.['application/json']?.schema;
        if (jsonResponseSchema && !isRef(jsonResponseSchema) && ["object", "array"].includes(jsonResponseSchema.type!)) {
          const schemaName = `${_upperFirst(_camelCase(operation.operationId ?? `${path}-${method}`))}${code}Response`;
          spec.components!.schemas![schemaName] = jsonResponseSchema;
          response!.content!['application/json'].schema = {
            $ref: `#/components/schemas/${schemaName}`,
          };
        }
      });
    }
  }));

  // "Hoist" any nested object definitions in arrays/maps that aren't already refs, as parseOpenapi will treat the
  // type as "any" if they're defined inline (and not a ref)
  Object.entries(spec.components?.schemas ?? {}).forEach(([name, schema]) => {
    if (!isRef(schema)) {
      const refs = hoistInlineObjectSubSchemas([name], schema);
      refs.forEach(ref => {
        spec.components!.schemas![ref.name] = ref.schema;
      });
    }
  });

  // "Inline" any refs to non objects/enums
  const inlinedRefs: Set<string> = new Set();
  spec = JSON.parse(JSON.stringify(spec, (k, v) => {
    if (v && typeof v === "object" && v.$ref) {
      const resolved = resolveRef(spec, v.$ref);
      if (resolved && resolved.type && resolved.type !== "object" && !(resolved.type === "string" && resolved.enum)) {
        inlinedRefs.add(v.$ref);
        return resolved;
      }
    }
    return v;
  }));

  // Delete the non object schemas that were inlined
  [...inlinedRefs].forEach(ref => {
    const parts = splitRef(ref);
    if (parts.length === 3 && parts[0] === "components" && parts[1] === "schemas") {
      delete spec.components!.schemas![parts[2]];
    }
  });

  // Start with the data from https://github.com/webpro/parse-openapi which extracts most of what we need
  const data = { ...parseOpenapi.parse(spec), metadata };

  // Mutate the models with enough data to render composite models in the templates
  ensureCompositeModels(data);

  // Augment operations with additional data
  data.services.forEach((service) => {

    // Keep track of the request and response models we need the service (ie api client) to import
    const requestModelImports: string[] = [];
    const responseModelImports: string[] = [];

    service.operations.forEach((op) => {
      // Extract the operation back from the openapi spec
      const specOp = (spec as any)?.paths?.[op.path]?.[op.method.toLowerCase()] as OpenAPIV3.OperationObject | undefined;

      // Add vendor extensions
      (op as any).vendorExtensions = (op as any).vendorExtensions ?? {};
      copyVendorExtensions(specOp ?? {}, (op as any).vendorExtensions);

      if (specOp) {
        // parseOpenapi has a method to retrieve the operation responses, but later filters to only
        // return information about successful (2XX) responses. We call the method directly to retrieve
        // all responses
        const responses = getOperationResponses(spec, specOp.responses);
        (op as any).responses = responses;

        // Add all response models to the response model imports
        responseModelImports.push(...responses.filter(r => r.export === "reference").map(r => r.type));

        const defaultResponse = resolveIfRef(spec, specOp.responses?.['default']);

        [...responses, ...op.results].forEach((response) => {
          // Check whether this response is actually the "default" response.
          if (response.code === 200 && defaultResponse && _isEqual(response, getOperationResponse(spec, defaultResponse, 200))) {
            // For backwards compatibility with OpenAPI generator, we set the response code for the default response to 0.
            // See: https://github.com/OpenAPITools/openapi-generator/blob/8f2676c5c2bcbcc41942307e5c8648cee38bcc44/modules/openapi-generator/src/main/java/org/openapitools/codegen/CodegenResponse.java#L622
            // TODO: we should likely revisit this to make the handler wrappers more intuitive for the default response case, as
            // the code 0 would actually need to be returned by the server for marshalling etc to work for the model associated with
            // the default response.
            response.code = 0;
          }

          const matchingSpecResponse = specOp.responses[`${response.code}`];

          // parseOpenapi does not distinguish between returning an "any" or returning "void"
          // We distinguish this by looking back each response in the spec, and checking whether it
          // has content
          if (matchingSpecResponse) {
            // Resolve the ref if necessary
            const specResponse = resolveIfRef(spec, matchingSpecResponse);

            // When there's no content, we set the type to 'void'
            if (!specResponse.content) {
              response.type = 'void';
            } else {
              // Add the response media types
              (response as any).mediaTypes = Object.keys(specResponse.content);
            }
          }
        });

        // If the operation didn't specify an operationId, we need to generate one in a backwards compatible way
        // which matches openapi generator
        if (!specOp.operationId) {
          (op as any).name = _camelCase(`${op.path.replace(/{(.*?)}/g, 'by-$1').replace(/[/:]/g, '-')}-${op.method}`);
        }
      }

      const specParametersByName = Object.fromEntries((specOp?.parameters ?? []).map((p) => {
        const param = resolveIfRef(spec, p);
        return [param.name, param];
      }));

      // Loop through the parameters
      op.parameters.forEach((parameter) => {
        // Add the request model import
        if (parameter.export === "reference") {
          requestModelImports.push(parameter.type);
        }

        const specParameter = specParametersByName[parameter.prop];
        const specParameterSchema = resolveIfRef(spec, specParameter?.schema);

        if (specParameterSchema) {
          mutateWithOpenapiSchemaProperties(spec, parameter, specParameterSchema);
        }

        if (parameter.in === "body") {
          // Parameter name for the body is it's type in camelCase
          parameter.name = parameter.export === "reference" ? _camelCase(parameter.type) : "body";
          parameter.prop = "body";

          // The request body is not in the "parameters" section of the openapi spec so we won't have added the schema
          // properties above. Find it here.
          const specBody = resolveIfRef(spec, specOp?.requestBody);
          if (specBody) {
            if (parameter.mediaType) {
              const bodySchema = resolveIfRef(spec, specBody.content?.[parameter.mediaType]?.schema);
              if (bodySchema) {
                mutateWithOpenapiSchemaProperties(spec, parameter, bodySchema);
              }
            }
            // Track all the media types that can be accepted in the request body
            (parameter as any).mediaTypes = Object.keys(specBody.content);
          }
        } else if (["query", "header"].includes(parameter.in) && specParameter) {
          // Translate style/explode to OpenAPI v2 style collectionFormat
          // https://spec.openapis.org/oas/v3.0.3.html#style-values
          const style = specParameter.style ?? (parameter.in === "query" ? "form" : "simple");
          const explode = specParameter.explode ?? style === "form";

          if (parameter.in === "query") {
            (parameter as any).collectionFormat = explode ? "multi" : ({ spaceDelimited: "ssv", pipeDelimited: "tsv", simple: "csv", form: "csv" }[style] ?? "multi");
          } else { // parameter.in === "header"
            (parameter as any).collectionFormat = explode ? "multi" : "csv";
          }
        }

        mutateModelWithAdditionalTypes(parameter);
      });

      // Add language types to response models
      [...((op as any).responses ?? []), ...op.results].forEach(mutateModelWithAdditionalTypes);

      // Add variants of operation name
      (op as any).operationIdPascalCase = _upperFirst(op.name);
      (op as any).operationIdKebabCase = _kebabCase(op.name);
      (op as any).operationIdSnakeCase = _snakeCase(op.name);
    });

    // Lexicographical ordering of operations to match openapi generator
    service.operations = _orderBy(service.operations, (op) => op.name);

    // Add the models to import
    (service as any).modelImports = _orderBy(_uniq([...service.imports, ...requestModelImports, ...responseModelImports]));

    // Add the service class name
    (service as any).className = `${service.name}Api`;
  });

  // Augment models with additional data
  data.models.forEach((model) => {
    // Add a snake_case name
    (model as any).nameSnakeCase = _snakeCase(model.name);

    const matchingSpecModel = spec?.components?.schemas?.[model.name]

    if (matchingSpecModel) {
      const specModel = resolveIfRef(spec, matchingSpecModel);

      mutateWithOpenapiSchemaProperties(spec, model, specModel);

      // Add unique imports
      (model as any).uniqueImports = _orderBy(_uniq([
        ...model.imports,
        // Include property imports, if any
        ...model.properties.filter(p => p.export === "reference").map(p => p.type),
      ]));

      // Add deprecated flag if present
      (model as any).deprecated = specModel.deprecated || false;

      // If the model has "additionalProperties" there should be a "dictionary" property
      if (specModel.additionalProperties) {
        (model as any).additionalPropertiesProperty = model.properties.find(p => !p.name && p.export === "dictionary");
      }

      // Augment properties with additional data
      model.properties.forEach((property) => {
        const matchingSpecProperty = specModel.properties?.[property.name];

        if (matchingSpecProperty) {
          const specProperty = resolveIfRef(spec, matchingSpecProperty);
          mutateWithOpenapiSchemaProperties(spec, property, specProperty);
        }

        // Add language-specific names/types
        mutateModelWithAdditionalTypes(property);
      });
    }
  });

  // Order models lexicographically by name
  data.models = _orderBy(data.models, d => d.name);

  // Order services so default appears first, then otherwise by name
  data.services = _orderBy(data.services, (s => s.name === "Default" ? "" : s.name));

  // All operations across all services
  const allOperations = _uniqBy(data.services.flatMap(s => s.operations), o => o.name);

  // Add top level vendor extensions
  const vendorExtensions: { [key: string]: any } = {};
  copyVendorExtensions(spec ?? {}, vendorExtensions);

  return {
    ...data,
    allOperations,
    info: spec.info,
    vendorExtensions,
  };
};

const resolveTemplateDir = (rootScriptDir: string, templateDir: string) => {
  // Prefer built in template, eg "typescript-lambda-handlers"
  const builtinTemplateDir = path.join(rootScriptDir, "generators", templateDir);
  if (fs.existsSync(builtinTemplateDir)) {
    return builtinTemplateDir;
  }

  // Otherwise use as-is, as a directory relative to cwd
  if (fs.existsSync(templateDir)) {
    return templateDir;
  }

  throw new Error(`Template directory ${templateDir} does not exist!`);
};

export default async (argv: string[], rootScriptDir: string) => {
  const args = parse<Arguments>({
    specPath: { type: String },
    metadata: { type: String, optional: true },
    templateDirs: { type: String, multiple: true },
    outputPath: { type: String },
    printData: { type: Boolean, optional: true },
  }, { argv });

  const spec = (await SwaggerParser.bundle(args.specPath)) as any;

  // Build data
  const data = buildData(spec, JSON.parse(args.metadata ?? '{}'));

  if (args.printData) {
    console.log(JSON.stringify(data, null, 2));
  }

  // Read all .ejs files in each template directory
  const templates = args.templateDirs.flatMap(t => fs.readdirSync(resolveTemplateDir(rootScriptDir, t), {
    recursive: true,
    withFileTypes: true
  }).filter(f => f.isFile() && f.name.endsWith('.ejs')).map(f => path.join(f.parentPath ?? f.path, f.name)));

  // Render the templates with the data from the spec
  const renderedFiles = templates.map((template) => {
    const templateContents = fs.readFileSync(template, 'utf-8');
    return ejs.render(templateContents, data);
  });

  // Prior to writing the new files, clean up
  cleanGeneratedCode(args.outputPath);

  // Write the rendered files
  splitAndWriteFiles(renderedFiles, args.outputPath);
};
