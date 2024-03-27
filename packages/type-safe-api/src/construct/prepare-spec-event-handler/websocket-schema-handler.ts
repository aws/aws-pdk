/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { // eslint-disable-line
  ApiGatewayV2,
  CreateModelCommandOutput,
  GetModelsCommandOutput,
  GetRoutesCommandOutput,
  Model,
  Route,
  UpdateModelCommandOutput,
} from "@aws-sdk/client-apigatewayv2";
import { // eslint-disable-line
  S3,
} from "@aws-sdk/client-s3";
import type { OpenAPIV3 } from "openapi-types";
import { S3Location } from ".";
import {
  ApiGatewaySchemaWithRefs,
  extractWebSocketSchemas,
} from "./websocket-schema";

export interface WebSocketSchemaResourceProperties {
  readonly apiId: string;
  readonly inputSpecLocation: S3Location;
  readonly serverOperationPaths: {
    [routeKey: string]: string;
  };
}

/**
 * Cloudformation event type for custom resource
 */
interface OnEventRequest {
  /**
   * The type of cloudformation request
   */
  readonly RequestType: "Create" | "Update" | "Delete";
  /**
   * Physical resource id of the custom resource
   */
  readonly PhysicalResourceId?: string;
  /**
   * Properties for preparing the websocket api models
   */
  readonly ResourceProperties: WebSocketSchemaResourceProperties;
}

interface OnEventResponse {
  /**
   * Physical resource id of the custom resource
   */
  readonly PhysicalResourceId: string;
  /**
   * Data returned by the custom resource
   */
  readonly Data?: {};
}

const BATCH_SIZE = 10;

const s3 = new S3({
  customUserAgent: `aws-pdk/type-safe-api/ws-schema`,
});
const apiGw = new ApiGatewayV2({
  customUserAgent: `aws-pdk/type-safe-api/ws-schema`,
});

/**
 * Chunk an array into sub-arrays of the given size
 */
const chunk = <T>(items: T[], size: number = BATCH_SIZE): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

/**
 * Delete a batch of models
 */
const batchDeleteModels = async (
  apiId: string,
  routes: { [routeKey: string]: Route },
  models: Model[]
) => {
  for (const batch of chunk(models)) {
    await Promise.all(
      batch.map(async (m) => {
        // If there's a route for this model, and it's associated with this model, we need to first remove the association,
        // since cloudformation will delete the route later, and we're not allowed to delete a model that's still referenced
        // by a route
        if (
          routes[m.Name!] &&
          routes[m.Name!].RequestModels?.model === m.Name!
        ) {
          await apiGw.updateRoute({
            ...routes[m.Name!],
            ApiId: apiId,
            RouteId: routes[m.Name!].RouteId!,
            RequestModels: {
              model: "",
            },
            ModelSelectionExpression: undefined,
          });
        }

        await apiGw.deleteModel({
          ApiId: apiId,
          ModelId: m.ModelId!,
        });
      })
    );
  }
};

/**
 * Retrieve all models which already exist on the api
 */
const getAllModelsByRouteKey = async (
  apiId: string
): Promise<{ [routeKey: string]: Model }> => {
  let nextToken: string | undefined = undefined;
  const models: Model[] = [];
  do {
    const res: GetModelsCommandOutput = await apiGw.getModels({
      ApiId: apiId,
      NextToken: nextToken,
    });
    nextToken = res.NextToken;
    models.push(...(res.Items ?? []));
  } while (nextToken);

  // Models are named with the route key
  return Object.fromEntries(models.map((m) => [m.Name!, m]));
};

const getAllRoutesByRouteKey = async (
  apiId: string
): Promise<{ [routeKey: string]: Route }> => {
  let nextToken: string | undefined = undefined;
  const routes: Route[] = [];
  do {
    const res: GetRoutesCommandOutput = await apiGw.getRoutes({
      ApiId: apiId,
      NextToken: nextToken,
    });
    nextToken = res.NextToken;
    routes.push(...(res.Items ?? []));
  } while (nextToken);

  return Object.fromEntries(routes.map((r) => [r.RouteKey!, r]));
};

/**
 * Wrap the schema from the spec in our protocol-specific schema
 */
const wrapSchema = (schema: ApiGatewaySchemaWithRefs) => ({
  type: "object",
  properties: {
    // All inputs must have a "route" which is our route selector
    route: {
      type: "string",
    },
    // Payload references the definition
    payload: {
      $ref: "#/definitions/Payload",
    },
  },
  // When we don't have a schema, the payload can be anything, including not specified
  required: ["route", ...(schema ? ["payload"] : [])],
  definitions: {
    ...schema?.definitions,
    // The payload is of the operation schema type, or {} which means "any"
    Payload: schema?.schema ?? {},
  },
});

/**
 * Create a batch of models with the appropriate schema
 */
const batchCreateModels = async (
  apiId: string,
  routeKeys: string[],
  schemas: { [routeKey: string]: ApiGatewaySchemaWithRefs }
): Promise<{ [routeKey: string]: string }> => {
  const results: CreateModelCommandOutput[] = [];
  for (const batch of chunk(routeKeys)) {
    results.push(
      ...(await Promise.all(
        batch.map(async (routeKey) =>
          apiGw.createModel({
            ApiId: apiId,
            Name: routeKey,
            ContentType: "application/json",
            Schema: JSON.stringify(wrapSchema(schemas[routeKey])),
          })
        )
      ))
    );
  }
  return Object.fromEntries(results.map((r) => [r.Name!, r.ModelId!]));
};

/**
 * Update a batch of models with the new schema
 */
const batchUpdateModels = async (
  apiId: string,
  models: Model[],
  schemas: { [routeKey: string]: ApiGatewaySchemaWithRefs }
): Promise<{ [routeKey: string]: string }> => {
  const results: UpdateModelCommandOutput[] = [];
  for (const batch of chunk(models)) {
    results.push(
      ...(await Promise.all(
        batch.map(async (model) =>
          apiGw.updateModel({
            ApiId: apiId,
            ModelId: model.ModelId!,
            ContentType: "application/json",
            Schema: JSON.stringify(wrapSchema(schemas[model.Name!])),
          })
        )
      ))
    );
  }
  return Object.fromEntries(results.map((r) => [r.Name!, r.ModelId!]));
};

/**
 * Create or update the models
 */
const createOrUpdateModels = async (
  properties: WebSocketSchemaResourceProperties,
  routes: { [routeKey: string]: Route }
): Promise<{ [routeKey: string]: string }> => {
  const modelsByRouteKey = await getAllModelsByRouteKey(properties.apiId);
  const existingRouteKeys = new Set(Object.keys(modelsByRouteKey));
  const newRouteKeys = new Set(Object.keys(properties.serverOperationPaths));

  const deletedRouteKeys = [...existingRouteKeys].filter(
    (id) => !newRouteKeys.has(id)
  );
  console.log("Operations to delete", deletedRouteKeys);
  const addedRouteKeys = [...newRouteKeys].filter(
    (id) => !existingRouteKeys.has(id)
  );
  console.log("Operations to add", addedRouteKeys);
  const updateRouteKeys = [...newRouteKeys].filter((id) =>
    existingRouteKeys.has(id)
  );
  console.log("Operations to update", updateRouteKeys);

  // Delete all the models to delete
  await batchDeleteModels(
    properties.apiId,
    routes,
    deletedRouteKeys.map((id) => modelsByRouteKey[id])
  );

  // Load the spec
  const spec = JSON.parse(
    await (
      await s3.getObject({
        Bucket: properties.inputSpecLocation.bucket,
        Key: properties.inputSpecLocation.key,
      })
    ).Body!.transformToString("utf-8")
  ) as OpenAPIV3.Document;

  // Extract the schemas from the spec
  const schemas = extractWebSocketSchemas(
    [...addedRouteKeys, ...updateRouteKeys],
    properties.serverOperationPaths,
    spec
  );

  // Create/update the relevant models
  return {
    ...(await batchCreateModels(
      properties.apiId,
      addedRouteKeys.filter((id) => schemas[id]),
      schemas
    )),
    ...(await batchUpdateModels(
      properties.apiId,
      updateRouteKeys
        .filter((id) => schemas[id])
        .map((id) => modelsByRouteKey[id]),
      schemas
    )),
  };
};

/**
 * Delete all models
 */
const deleteModels = async (
  properties: WebSocketSchemaResourceProperties,
  routes: { [routeKey: string]: Route }
) => {
  const modelsByRouteKey = await getAllModelsByRouteKey(properties.apiId);
  await batchDeleteModels(
    properties.apiId,
    routes,
    Object.values(modelsByRouteKey)
  );
};

/**
 * Handler for creating websocket schemas
 */
exports.handler = async (event: OnEventRequest): Promise<OnEventResponse> => {
  const PhysicalResourceId =
    event.PhysicalResourceId ?? `${event.ResourceProperties.apiId}-models`;
  const routes = await getAllRoutesByRouteKey(event.ResourceProperties.apiId);
  switch (event.RequestType) {
    case "Create":
    case "Update":
      await createOrUpdateModels(event.ResourceProperties, routes);
      break;
    case "Delete":
      await deleteModels(event.ResourceProperties, routes);
      break;
    default:
      break;
  }

  return {
    PhysicalResourceId,
  };
};
