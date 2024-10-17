/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import SwaggerParser from "@apidevtools/swagger-parser";
import { writeFile } from "projen/lib/util";
import { parse } from "ts-command-line-args";

/**
 * Arguments for generating an AsyncAPI specification
 */
interface Arguments {
  /**
   * Path to the input OpenAPI specification json file (.api.json).
   */
  readonly specPath: string;
  /**
   * Path to write the output json AsyncAPI spec
   */
  readonly outputPath: string;
}

interface AsyncOp {
  readonly routeKey: string;
  readonly schema?: any;
  readonly direction: 'client_to_server' | 'server_to_client' | 'bidirectional';
  readonly description?: string;
  readonly tags?: string[];
}

const extractAsyncOps = (openApiSpec: any): AsyncOp[] => {
  const operations: AsyncOp[] = [];

  Object.entries(openApiSpec.paths || {}).forEach(([p, pathOp]: [string, any]) => {
    Object.entries(pathOp ?? {}).forEach(([method, operation]: [string, any]) => {
      if (!operation?.['x-async']?.direction) {
        throw new Error(`Operation ${method} ${p} did not have the x-async vendor extension. Please supply a valid Type Safe WebSocket API specification.`);
      }

      operations.push({
        routeKey: p.replace(/\//g, ''),
        schema: operation?.requestBody?.content?.['application/json']?.schema,
        direction: operation?.['x-async']?.direction,
        description: operation?.description,
        tags: operation?.tags,
      });
    });
  });

  return operations;
};

const generateAsyncApiSpec = (openApiSpec: any): any => {

  const operations = extractAsyncOps(openApiSpec);

  // One message per operation no matter the direction(s)
  const messages = Object.fromEntries(operations.map(op =>
    [op.routeKey, {
      name: op.routeKey,
      title: op.routeKey,
      summary: op.description,
      tags: (op.tags ?? []).map(t => ({ name: t })),
      contentType: op.schema ? 'application/json' : undefined,
      payload: {
        type: 'object',
        properties: {
          route: {
            type: 'string',
            const: op.routeKey,
          },
          payload: op.schema,
        },
        required: ['route', ...(op.schema ? ["payload"] : [])],
      },
    }],
  ));

  // One operation per direction each message is sent in.
  // Documentation is generated from a client perspective, so server -> client operations are prefixed with "on"
  const asyncApiOperations = Object.fromEntries(operations.flatMap(op => {
    const asyncApiOps: { action: string, title: string }[] = [];

    if (['bidirectional', 'client_to_server'].includes(op.direction)) {
      asyncApiOps.push({
        action: 'send',
        title: op.routeKey,
      });
    }
    if (['bidirectional', 'server_to_client'].includes(op.direction)) {
      asyncApiOps.push({
        action: 'receive',
        title: `On${op.routeKey}`,
      });
    }

    return asyncApiOps.map(asyncOp => [asyncOp.title, {
      ...asyncOp,
      channel: {
        $ref: '#/channels/default',
      },
      messages: [
        {
          $ref: `#/channels/default/messages/${op.routeKey}`,
        },
      ],
    }]);
  }));

  return {
    asyncapi: '3.0.0',
    info: openApiSpec.info,
    channels: {
      // WebSocket APIs have a single channel, on which all messages are sent back and forth
      default: {
        address: '/',
        messages: Object.fromEntries(Object.keys(messages).map(messageId => [messageId, {
          $ref: `#/components/messages/${messageId}`,
        }])),
      },
    },
    operations: asyncApiOperations,
    components: {
      messages,
      schemas: openApiSpec.components?.schemas,
    },
  };
};

export default async (argv: string[]) => {
  const args = parse<Arguments>({
    specPath: { type: String, alias: "s" },
    outputPath: { type: String, alias: "o" },
  }, { argv });

  const openApiSpec = (await SwaggerParser.bundle(args.specPath)) as any;

  const asyncApiSpec = generateAsyncApiSpec(openApiSpec);

  writeFile(args.outputPath, JSON.stringify(asyncApiSpec, null, 2), {
    readonly: true,
  });
};
