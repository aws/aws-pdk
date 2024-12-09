/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import { allFakers, Faker } from "@faker-js/faker";
import * as path from "path";
import { parse } from "ts-command-line-args";
import SwaggerParser from "@apidevtools/swagger-parser";
import { OpenAPIV3 } from "openapi-types";
import ReRegExp from "reregexp";
import _ from "lodash";

interface Arguments {
  readonly specPath: string;
  readonly outputPath: string;
  readonly locale: string;
  readonly maxArrayLength: number;
  readonly seed: number;
}

interface GenerateProps {
  readonly faker: Faker;
  readonly maxArrayLength: number;
  readonly maxCircularReferenceDepth: number;
}

const isRef = (obj: unknown): obj is OpenAPIV3.ReferenceObject => !!obj && typeof obj === "object" && "$ref" in obj;

const isSchemaObj = (obj: unknown): obj is OpenAPIV3.SchemaObject => !!obj && typeof obj === "object" && ("type" in obj || "allOf" in obj || "oneOf" in obj || "anyOf" in obj || "not" in obj);

const resolveSchemaRef = (spec: OpenAPIV3.Document, ref: string): OpenAPIV3.SchemaObject => {
  const refParts = ref.slice(2).split('/').map(p => p.replace(/~0/g, "~").replace(/~1/g, "/"));
  const resolved = _.get(spec, refParts) as unknown;
  if (!resolved) {
    throw new Error(`Unable to resolve ref ${ref} in spec`);
  }
  if (!isSchemaObj(resolved)) {
    throw new Error(`Expected ref to resolve to a schema ${ref}`);
  }
  return resolved;
};

export const generateMockDataForSchema = (
  spec: OpenAPIV3.Document,
  args: GenerateProps,
  schemaOrRef: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  propertyName?: string,
): object | string | number | boolean => {
  const faker = args.faker;

  let schema: OpenAPIV3.SchemaObject;

  let maxCircularReferenceDepth = args.maxCircularReferenceDepth;

  // Only circular references remain, so decrement the circular reference depth if we encounter one
  if (isRef(schemaOrRef)) {
    schema = resolveSchemaRef(spec, schemaOrRef.$ref);
    maxCircularReferenceDepth--;
  } else {
    schema = schemaOrRef;
  }

  const nextArgs = { ...args, maxCircularReferenceDepth };

  // Return examples if specified as they're likely better than any mocks we can generate ourselves
  if (schema.example) {
    return schema.example;
  }

  // For enums, just pick one of the values
  if (schema.enum) {
    return faker.helpers.arrayElement(schema.enum);
  }

  if (schema.not) {
    // Not isn't likely to occur in a Smithy-based project, but it could come up in OpenAPI
    // To keep this simple we return either an object or a string - since by definition we just need to
    // return a type that isn't the specified one.
    const notResponse = generateMockDataForSchema(spec, nextArgs, schema.not);
    if (typeof notResponse === "object") {
      return generateMockDataForSchema(spec, nextArgs, { type: "string" });
    }
    return generateMockDataForSchema(spec, nextArgs, { type: "object" });
  }

  if (schema.type === "integer") {
    return faker.number.int({ min: schema.minimum, max: schema.maximum });
  }

  if (schema.type === "number") {
    return faker.number.float({ min: schema.minimum, max: schema.maximum });
  }

  if (schema.type === "boolean") {
    return faker.datatype.boolean();
  }

  if (schema.type === "string") {
    return generateMockString(faker, schema, propertyName);
  }

  if (schema.type === "array") {
    // Hit max circular ref depth, just return an empty list here
    if (args.maxCircularReferenceDepth <= 0) {
      return [];
    }

    // Pick the lower "max items" of the max array length option and the value defined in the schema
    let maxItems: number | undefined = undefined;
    if (args.maxArrayLength !== undefined && schema.maxItems !== undefined) {
      maxItems = Math.min(args.maxArrayLength, schema.maxItems);
    } else {
      maxItems = args.maxArrayLength ?? schema.maxItems;
    }
    // Pick the lower minimum number of items (to avoid min > max if max array length is lower than the min in the schema)
    let minItems: number | undefined = undefined;
    if (maxItems !== undefined && schema.minItems !== undefined) {
      minItems = Math.min(maxItems, schema.minItems);
    } else {
      minItems = schema.minItems;
    }

    if (isRef(schema.items) && !minItems) {
      // Circular reference, where we're allowed zero items.
      return [];
    }

    return [...new Array(faker.number.int({ min: minItems, max: maxItems })).keys()].map(() =>
      generateMockDataForSchema(spec, nextArgs, (schema as OpenAPIV3.ArraySchemaObject).items));
  }

  // Type is an object, or allOf/oneOf/anyOf

  // If we've hit max depth, return an empty object
  if (args.maxCircularReferenceDepth <= 0) {
    return {};
  }

  if (schema.allOf) {
    // For allOf, combine the mocks together
    return schema.allOf.map(s => generateMockDataForSchema(spec, nextArgs, s) as object).reduce((allMocks, mock) => ({
      ...allMocks,
      ...mock,
    }), {});
  }

  if (schema.oneOf || schema.anyOf) {
    const firstSubschema = (schema.oneOf || schema.anyOf)![0];
    if (!firstSubschema) {
      throw new Error(`oneOf / anyOf must define at least one subschema`);
    }
    // For oneOf / anyOf pick the first
    return generateMockDataForSchema(spec, nextArgs, (schema.oneOf || schema.anyOf)![0]);
  }

  if (schema.type === "object") {
    // Additional properties that aren't circular refs
    if (!schema.properties && typeof schema.additionalProperties === "object" && !isRef(schema.additionalProperties)) {
      return Object.fromEntries([...new Array(faker.number.int({ min: 0, max: args.maxArrayLength ?? 0 })).keys()]
        .map(i => [`${faker.lorem.slug(1)}-${i}`, generateMockDataForSchema(spec, nextArgs, schema.additionalProperties as OpenAPIV3.SchemaObject)]));
    }

    const requiredProperties = new Set(schema.required ?? []);
    return Object.fromEntries(Object.entries(schema.properties ?? {}).filter(([k, v]) => {
      // Filter out circular references we've seen if they are not required
      // If they are required, we'll recursively include them until the max depth is hit
      return requiredProperties.has(k) || !isRef(v);
    }).map(([k, v]) => [k, generateMockDataForSchema(
      spec,
      nextArgs,
      v,
      k,
    )]));
  }

  // Type is "any" - just return an empty object
  return {};
};

const generateStringFromRegex = (pattern: string): string | undefined => {
  const random = Math.random;
  const warn = console.warn;
  try {
    // Fix random to ensure mocked data is deterministic
    Math.random = () => 0.5;
    // ReRegExp prints warnings to the console which add unnecessary noise
    console.warn = () => {};
    return new ReRegExp(pattern).build();
  } catch {
    // Couldn't convert regex to string, don't fail, just be less strict
  } finally {
    Math.random = random;
    console.warn = warn;
  }
  return undefined;
}

const generateMockString = (faker: Faker, schema: OpenAPIV3.SchemaObject, inPropertyName?: string): string => {
  const propertyName = inPropertyName?.toLowerCase();
  const format = schema.format ?? "";

  // Regex defines the expected string - try generating something that matches
  if (schema.pattern) {
    const mockFromPattern = generateStringFromRegex(schema.pattern);
    if (mockFromPattern) {
      return mockFromPattern;
    }
  }

  if (["date", "date-time", "datetime"].includes(format)) {
    const date = faker.date.anytime().toISOString();
    if (format === "date") {
      return date.split('T')[0];
    }
    return date;
  }

  if (["email", "idn-email"].includes(format) || propertyName?.endsWith("email")) {
    return faker.internet.email();
  }

  if (["uri", "url", "uri-reference", "iri", "iri-reference", "uri-template"].includes(format) || propertyName?.endsWith("url")) {
    return faker.internet.url();
  }

  if (["hostname", "idn-hostname"].includes(format)) {
    return faker.internet.domainName();
  }

  if (format === "ipv4") {
    return faker.internet.ipv4();
  }

  if (format === "ipv6") {
    return faker.internet.ipv6();
  }

  if (format === "uuid") {
    return faker.string.uuid();
  }

  let text = faker.lorem.words(3);
  if (schema.minLength !== undefined) {
    text = faker.lorem.words(schema.minLength);
  }
  if (schema.maxLength !== undefined) {
    text = text.slice(0, schema.maxLength);
  }

  if (format === "byte") {
    return Buffer.from(text, "utf-8").toString('base64');
  }

  return text;
};

// Entry point
export default async (argv: string[]) => {
  const args = parse<Arguments>({
    specPath: { type: String },
    outputPath: { type: String },
    locale: { type: String, defaultValue: 'en' },
    maxArrayLength: { type: Number, defaultValue: 3 },
    seed: { type: Number, defaultValue: 1337 },
  }, { argv });

  const faker = allFakers[args.locale as keyof typeof allFakers];

  if (!faker) {
    throw new Error(`Locale ${args.locale} is not supported.`);
  }

  faker.seed(args.seed);
  faker.setDefaultRefDate(new Date("2021-06-10"));

  let spec = await SwaggerParser.bundle(args.specPath) as OpenAPIV3.Document;

  // Dereference all but circular references
  spec = await SwaggerParser.dereference(spec, { dereference: { circular: 'ignore' } }) as OpenAPIV3.Document;

  // Write mocks to a "mocks" directory. Clean it up if it doesn't exist already.
  const outPath = path.join(args.outputPath, "mocks");
  fs.rmSync(outPath, { recursive: true, force: true });
  fs.mkdirSync(outPath, { recursive: true });

  Object.entries(spec.paths ?? {}).forEach(([p, pathOp]) => {
    Object.entries(pathOp ?? {}).forEach(([method, operation]) => {
      if (operation && typeof operation === "object" && "responses" in operation) {
        Object.entries(operation.responses).forEach(([responseCode, response]) => {
          if (!isRef(response)) {
            const schema = response?.content?.['application/json']?.schema;
            if (schema) {
              const mockResponseFilePath = path.join(outPath, `${method.toLowerCase()}${p.replace(/\//g, "-")}-${responseCode}.json`);
              const mockResponse = generateMockDataForSchema(spec, {
                faker,
                maxArrayLength: args.maxArrayLength,
                maxCircularReferenceDepth: 2,
              }, schema);
              fs.writeFileSync(mockResponseFilePath, JSON.stringify(mockResponse, null, 2));
            }
          }
        });
      }
    });
  });
};
