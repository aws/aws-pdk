/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import type { OpenAPIV3 } from "openapi-types";
import { DefaultAuthorizerIds, HttpMethods } from "./constants";
import { ApiGatewayIntegration } from "../integrations";
import type {
  Method,
  MethodAndPath,
  OperationLookup,
  SerializedCorsOptions,
  TypeSafeApiIntegrationOptions,
  TypeSafeApiIntegrations,
} from "../spec";
import { SerialisedAuthorizerReference } from "../spec/api-gateway-auth";

/**
 * Serialise a method and path into a single string
 */
export const concatMethodAndPath = ({ method, path }: MethodAndPath) =>
  `${method.toLowerCase()}||${path.toLowerCase()}`;

/**
 * Serialized integration for a method
 */
export interface SerializedMethodIntegration {
  /**
   * The lambda function invocation uri for the api method
   */
  readonly integration: ApiGatewayIntegration;
  /**
   * The authorizer (if any) to apply to the method
   */
  readonly methodAuthorizer?: SerialisedAuthorizerReference;
  /**
   * Options for the integration
   */
  readonly options?: TypeSafeApiIntegrationOptions;
}

/**
 * Options for API keys
 */
export interface SerializedApiKeyOptions {
  /**
   * Source type for an API key
   */
  readonly source: string;
  /**
   * Set to true to require an API key on all operations by default.
   * Only applicable when the source is HEADER.
   */
  readonly requiredByDefault?: boolean;
}

/**
 * Options for preparing an api spec for deployment by api gateway
 */
export interface PrepareApiSpecOptions {
  /**
   * Integrations for api operations
   */
  readonly integrations: { [operationId: string]: SerializedMethodIntegration };
  /**
   * Options for cross-origin resource sharing
   */
  readonly corsOptions?: SerializedCorsOptions;
  /**
   * Operation id to method and path mapping
   */
  readonly operationLookup: OperationLookup;
  /**
   * Security schemes to add to the spec
   */
  readonly securitySchemes: { [key: string]: OpenAPIV3.SecuritySchemeObject };
  /**
   * The default authorizer to reference
   */
  readonly defaultAuthorizerReference?: SerialisedAuthorizerReference;
  /**
   * Default options for API keys
   */
  readonly apiKeyOptions?: SerializedApiKeyOptions;
}

/**
 * API key options when rendering an authorizer
 */
interface AuthorizerApiKeyOptions {
  /**
   * Whether an api key is required for the method
   */
  readonly apiKeyRequired?: boolean;
}

/**
 * Return an array of security scheme references including the api key one if required
 */
const apiKeySecurityReference = (options?: AuthorizerApiKeyOptions) =>
  options?.apiKeyRequired ? [{ [DefaultAuthorizerIds.API_KEY]: [] }] : [];

/**
 * Generate a "no auth" spec snippet
 */
const noAuthSpecSnippet = (options?: AuthorizerApiKeyOptions) => ({
  security: apiKeySecurityReference(options),
  "x-amazon-apigateway-auth": {
    type: "NONE",
  },
});

/**
 * Create the OpenAPI definition with api gateway extensions for the given authorizer
 * @param methodAuthorizer the authorizer used for the method
 * @param options api integration options
 */
const applyMethodAuthorizer = (
  methodAuthorizer?: SerialisedAuthorizerReference,
  options?: AuthorizerApiKeyOptions
) => {
  if (methodAuthorizer || options) {
    if (methodAuthorizer?.authorizerId === DefaultAuthorizerIds.NONE) {
      return noAuthSpecSnippet(options);
    } else {
      return {
        security: [
          ...(methodAuthorizer
            ? [
                {
                  [methodAuthorizer.authorizerId]:
                    methodAuthorizer.authorizationScopes || [],
                },
              ]
            : []),
          ...apiKeySecurityReference(options),
        ],
      };
    }
  }
  return {};
};

/**
 * Adds API Gateway integrations and auth to the given operation
 */
const applyMethodIntegration = (
  path: string,
  method: Method,
  {
    integrations,
    corsOptions,
    apiKeyOptions,
    defaultAuthorizerReference,
  }: PrepareApiSpecOptions,
  operation: OpenAPIV3.OperationObject,
  getOperationName: (methodAndPath: MethodAndPath) => string
): OpenAPIV3.OperationObject | undefined => {
  const operationName = getOperationName({ method, path });
  if (!(operationName in integrations)) {
    throw new Error(
      `Missing required integration for operation ${operationName} (${method} ${path})`
    );
  }

  let { methodAuthorizer, integration, options } =
    integrations[operationName as keyof TypeSafeApiIntegrations];

  validateAuthorizerReference(
    methodAuthorizer,
    operation.security,
    operationName
  );

  let methodApiKeyOptions: AuthorizerApiKeyOptions | undefined = options;

  // When no API key options are present on the method, require the API key if it's
  // required by default
  if (!methodApiKeyOptions && apiKeyOptions?.requiredByDefault) {
    methodApiKeyOptions = { apiKeyRequired: true };
  }

  // Can only "require" an API key if it's in a header, since we only define the security
  // scheme we'd reference in this case.
  if (
    apiKeyOptions?.source !== "HEADER" &&
    methodApiKeyOptions?.apiKeyRequired
  ) {
    throw new Error(
      `Cannot require an API Key when API Key source is not HEADER: ${operationName} (${method} ${path})`
    );
  }

  // Apply the default authorizer unless a method authorizer is defined
  methodAuthorizer = methodAuthorizer ?? defaultAuthorizerReference;

  return {
    ...operation,
    responses: Object.fromEntries(
      Object.entries(operation.responses).map(([statusCode, response]) => [
        statusCode,
        {
          ...response,
          headers: {
            ...(corsOptions ? getCorsHeaderDefinitions() : {}),
            // TODO: Consider following response header references
            ...(response as OpenAPIV3.ResponseObject).headers,
          },
        },
      ])
    ),
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html
    "x-amazon-apigateway-integration": integration,
    ...applyMethodAuthorizer(methodAuthorizer, methodApiKeyOptions),
  } as any;
};

const getCorsHeaderDefinitions = (): {
  [name: string]: OpenAPIV3.HeaderObject;
} => ({
  "Access-Control-Allow-Origin": {
    schema: { type: "string" },
  },
  "Access-Control-Allow-Methods": {
    schema: { type: "string" },
  },
  "Access-Control-Allow-Headers": {
    schema: { type: "string" },
  },
});

const generateCorsResponseHeaders = (
  corsOptions: SerializedCorsOptions
): { [key: string]: string } => ({
  "Access-Control-Allow-Headers": `'${corsOptions.allowHeaders.join(",")}'`,
  "Access-Control-Allow-Methods": `'${corsOptions.allowMethods.join(",")}'`,
  "Access-Control-Allow-Origin": `'${corsOptions.allowOrigins.join(",")}'`,
});

export const generateCorsResponseParameters = (
  corsOptions: SerializedCorsOptions,
  prefix: string = "method.response.header"
): { [key: string]: string } =>
  Object.fromEntries(
    Object.entries(generateCorsResponseHeaders(corsOptions)).map(
      ([header, value]) => [`${prefix}.${header}`, value]
    )
  );

/**
 * Generates an "options" method with no auth to respond with the appropriate headers if cors is enabled
 */
const generateCorsOptionsMethod = (
  pathItem: OpenAPIV3.PathItemObject,
  { corsOptions }: PrepareApiSpecOptions
): OpenAPIV3.PathItemObject => {
  // Do not generate if already manually defined, or cors not enabled
  if (HttpMethods.OPTIONS in pathItem || !corsOptions) {
    return {};
  }

  const statusCode = corsOptions.statusCode;

  return {
    [HttpMethods.OPTIONS]: {
      summary: "CORS Support",
      description: "Enable CORS by returning the correct headers",
      responses: {
        [`${statusCode}`]: {
          description: "Default response for CORS method",
          headers: getCorsHeaderDefinitions(),
          content: {},
        },
      },
      // @ts-ignore Ignore apigateway extensions which are not part of default openapi spec type
      "x-amazon-apigateway-integration": {
        type: "mock",
        requestTemplates: {
          "application/json": `{"statusCode": ${statusCode}}`,
        },
        responses: {
          default: {
            statusCode: `${statusCode}`,
            responseParameters: generateCorsResponseParameters(corsOptions),
            responseTemplates: {
              "application/json": "{}",
            },
          },
        },
      },
      // No auth for CORS options requests
      ...noAuthSpecSnippet(),
    },
  };
};

/**
 * Prepares a given api path by adding integrations, configuring auth
 */
const preparePathSpec = (
  path: string,
  pathItem: OpenAPIV3.PathItemObject,
  options: PrepareApiSpecOptions,
  getOperationName: (methodAndPath: MethodAndPath) => string
): OpenAPIV3.PathItemObject => {
  const supportedPathItemKeys = new Set<string>([
    // https://spec.openapis.org/oas/v3.0.3#path-item-object
    ...Object.values(HttpMethods),
    "summary",
    "description",
    "parameters",
    "servers",
    // All $refs should be resolved already, so we'll error if one remains somehow
  ]);
  const unsupportedMethodsInSpec = Object.keys(pathItem).filter(
    (method) => !supportedPathItemKeys.has(method)
  );
  if (unsupportedMethodsInSpec.length > 0) {
    throw new Error(
      `Path ${path} contains unsupported method${
        unsupportedMethodsInSpec.length > 1 ? "s" : ""
      } ${unsupportedMethodsInSpec.join(
        ", "
      )}. Supported methods are ${Object.values(HttpMethods).join(", ")}.`
    );
  }

  return {
    ...pathItem,
    ...Object.fromEntries(
      Object.values(HttpMethods)
        .filter((method) => pathItem[method])
        .map((method) => [
          method,
          applyMethodIntegration(
            path,
            method,
            options,
            pathItem[method]!,
            getOperationName
          ),
        ])
    ),
    // Generate an 'options' method required for CORS preflight requests if cors is enabled
    ...generateCorsOptionsMethod(pathItem, options),
  };
};

/**
 * Return whether the given OpenAPI object is a reference object
 */
const isRef = (obj: any): obj is OpenAPIV3.ReferenceObject => "$ref" in obj;

/**
 * Validate the construct security schemes against the security schemes in the original spec.
 * Construct-defined authorizers always override those in the spec if they have the same ID, however we validate that
 * we are not overriding an authorizer of a different type to avoid mistakes/mismatches between the spec and the
 * construct.
 * @param constructSecuritySchemes security schemes generated from the construct authorizers
 * @param existingSpecSecuritySchemes security schemes already defined in the spec
 */
const validateSecuritySchemes = (
  constructSecuritySchemes: { [key: string]: OpenAPIV3.SecuritySchemeObject },
  existingSpecSecuritySchemes?: {
    [key: string]: OpenAPIV3.SecuritySchemeObject | OpenAPIV3.ReferenceObject;
  }
) => {
  if (existingSpecSecuritySchemes) {
    const constructSecuritySchemeIds = new Set(
      Object.keys(constructSecuritySchemes)
    );
    const existingSecuritySchemeIds = new Set(
      Object.keys(existingSpecSecuritySchemes)
    );

    const overlappingSecuritySchemeIds = [...constructSecuritySchemeIds].filter(
      (id) => existingSecuritySchemeIds.has(id)
    );

    // Any overlapping security schemes (defined in both the spec (or source smithy model) and the construct) must be of the same type.
    // The one defined in the construct will take precedence since a custom/cognito authorizer can have a resolved arn in the construct,
    // and we allow usage in the model as a forward definition with blank arn.
    overlappingSecuritySchemeIds.forEach((schemeId) => {
      if (!isRef(existingSpecSecuritySchemes[schemeId])) {
        const existingScheme = existingSpecSecuritySchemes[
          schemeId
        ] as OpenAPIV3.SecuritySchemeObject;

        if (constructSecuritySchemes[schemeId].type !== existingScheme.type) {
          throw new Error(
            `Security scheme with id ${schemeId} was of type ${constructSecuritySchemes[schemeId].type} in construct but ${existingScheme.type} in OpenAPI spec or Smithy model.`
          );
        }
        const constructApiGatewayAuthType = (
          constructSecuritySchemes[schemeId] as any
        )["x-amazon-apigateway-authtype"];
        const existingApiGatewayAuthType = (existingScheme as any)[
          "x-amazon-apigateway-authtype"
        ];

        if (constructApiGatewayAuthType !== existingApiGatewayAuthType) {
          throw new Error(
            `Security scheme with id ${schemeId} was of type ${constructApiGatewayAuthType} in construct but ${existingApiGatewayAuthType} in OpenAPI spec or Smithy model.`
          );
        }
      } else {
        throw new Error(
          `Security scheme with id ${schemeId} is a reference in the OpenAPI spec or Smithy model which is not supported.`
        );
      }
    });
  }
};

/**
 * Validate the given authorizer reference (either default or at an operation level) defined in the construct against
 * those already in the spec.
 * @param constructAuthorizer the authorizer defined in the construct
 * @param existingSpecAuthorizers the authorizers already defined in the spec
 * @param operation the operation we are validating (for clearer error messages)
 */
const validateAuthorizerReference = (
  constructAuthorizer?: SerialisedAuthorizerReference,
  existingSpecAuthorizers?: OpenAPIV3.SecurityRequirementObject[],
  operation: string = "Default"
) => {
  // Only need to validate if defined in both - if just one we'll use that.
  if (constructAuthorizer && existingSpecAuthorizers) {
    const mergedSpecAuthorizers = Object.fromEntries(
      existingSpecAuthorizers.flatMap((securityRequirement) =>
        Object.keys(securityRequirement).map((id) => [
          id,
          securityRequirement[id],
        ])
      )
    );
    const specAuthorizerIds = Object.keys(mergedSpecAuthorizers);

    if (specAuthorizerIds.length > 1) {
      // Spec defined multiple authorizers but the construct can only specify one
      throw new Error(
        `${operation} authorizers ${specAuthorizerIds
          .sort()
          .join(
            ", "
          )} defined in the OpenAPI Spec or Smithy Model would be overridden by single construct authorizer ${
          constructAuthorizer.authorizerId
        }`
      );
    } else if (specAuthorizerIds.length === 1) {
      // Single authorizer - check that they have the same id
      if (specAuthorizerIds[0] !== constructAuthorizer.authorizerId) {
        throw new Error(
          `${operation} authorizer ${specAuthorizerIds[0]} defined in the OpenAPI Spec or Smithy Model would be overridden by construct authorizer ${constructAuthorizer.authorizerId}`
        );
      }

      // Check that there are no differing scopes between the construct and spec
      const specScopes = new Set(mergedSpecAuthorizers[specAuthorizerIds[0]]);
      const constructScopes = new Set(constructAuthorizer.authorizationScopes);
      const differingScopes = [
        ...[...specScopes].filter((scope) => !constructScopes.has(scope)),
        ...[...constructScopes].filter((scope) => !specScopes.has(scope)),
      ];
      if (differingScopes.length > 0) {
        throw new Error(
          `${operation} authorizer scopes ${[...specScopes].join(
            ", "
          )} defined in the OpenAPI Spec or Smithy Model differ from those in the construct (${[
            ...constructScopes,
          ].join(", ")})`
        );
      }
    } else if (constructAuthorizer.authorizerId !== DefaultAuthorizerIds.NONE) {
      // "security" section of spec is [] which means no auth, but the authorizer in the construct is not the "none" authorizer.
      throw new Error(
        `${operation} explicitly defines no auth in the OpenAPI Spec or Smithy Model which would be overridden by construct authorizer ${constructAuthorizer.authorizerId}`
      );
    }
  }
};

/**
 * Find all unique header parameters used in operations
 */
const findHeaderParameters = (spec: OpenAPIV3.Document): string[] => {
  const allHeaderParameters = Object.values(spec.paths).flatMap((pathDetails) =>
    Object.values(HttpMethods).flatMap((method) =>
      (pathDetails?.[method]?.parameters ?? []).flatMap((parameter) =>
        "in" in parameter && parameter.in === "header" ? [parameter.name] : []
      )
    )
  );
  const headerParameterSet = new Set<string>();
  return allHeaderParameters.filter((p) => {
    const seen = headerParameterSet.has(p);
    headerParameterSet.add(p);
    return !seen;
  });
};

/**
 * Prepares the api spec for deployment by adding integrations, configuring auth, etc
 */
export const prepareApiSpec = (
  spec: OpenAPIV3.Document,
  options: PrepareApiSpecOptions
): OpenAPIV3.Document => {
  // Reverse lookup for the operation name given a method and path
  const operationNameByPath = Object.fromEntries(
    Object.entries<MethodAndPath>(options.operationLookup).map(
      ([operationName, methodAndPath]) => [
        concatMethodAndPath(methodAndPath),
        operationName,
      ]
    )
  );
  const getOperationName = (methodAndPath: MethodAndPath) =>
    operationNameByPath[concatMethodAndPath(methodAndPath)];

  validateSecuritySchemes(
    options.securitySchemes,
    spec.components?.securitySchemes
  );
  validateAuthorizerReference(
    options.defaultAuthorizerReference,
    spec.security
  );

  // If there are cors options, add any header parameters defined in the spec as allowed headers to
  // save users from having to manually specify these (or face cors issues!)
  const corsOptions: SerializedCorsOptions | undefined = options.corsOptions
    ? {
        ...options.corsOptions,
        allowHeaders: [
          ...options.corsOptions.allowHeaders,
          ...findHeaderParameters(spec),
        ],
      }
    : undefined;

  const updatedOptions: PrepareApiSpecOptions = {
    ...options,
    corsOptions,
  };

  return {
    ...spec,
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-request-validators.html
    "x-amazon-apigateway-request-validators": {
      all: {
        validateRequestBody: true,
        validateRequestParameters: true,
      },
    },
    "x-amazon-apigateway-request-validator": "all",
    // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-gateway-responses.html
    "x-amazon-apigateway-gateway-responses": {
      BAD_REQUEST_BODY: {
        statusCode: 400,
        responseTemplates: {
          "application/json":
            '{"message": "$context.error.validationErrorString"}',
        },
        ...(corsOptions
          ? {
              responseParameters: generateCorsResponseParameters(
                corsOptions,
                "gatewayresponse.header"
              ),
            }
          : {}),
      },
    },
    paths: {
      ...Object.fromEntries(
        Object.entries(spec.paths).map(([path, pathDetails]) => [
          path,
          preparePathSpec(path, pathDetails!, updatedOptions, getOperationName),
        ])
      ),
    },
    components: {
      ...spec.components,
      securitySchemes: {
        // Apply any security schemes that already exist in the spec
        ...spec.components?.securitySchemes,
        // Construct security schemes override any in the spec with the same id
        ...updatedOptions.securitySchemes,
      },
    },
    ...(updatedOptions.apiKeyOptions
      ? {
          // https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-api-key-source.html
          "x-amazon-apigateway-api-key-source":
            updatedOptions.apiKeyOptions.source,
        }
      : {}),
  } as any;
};
