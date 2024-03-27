/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import * as fs from "fs";
import * as path from "path";
import { PDKNag } from "@aws/pdk-nag";
import { CustomResource, Duration, Stack } from "aws-cdk-lib";
import {
  CfnIntegration,
  CfnIntegrationResponse,
  CfnRoute,
  CfnStage,
  IWebSocketRouteAuthorizer,
  WebSocketApi,
  WebSocketIntegration,
  WebSocketRouteIntegration,
  WebSocketRouteOptions,
  WebSocketStage,
} from "aws-cdk-lib/aws-apigatewayv2";
import {
  WebSocketLambdaIntegration,
  WebSocketMockIntegration,
} from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  CfnPermission,
  Code,
  IFunction,
  Function as LambdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { Provider } from "aws-cdk-lib/custom-resources";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { OpenAPIV3 } from "openapi-types";
import { extractWebSocketSchemas } from "./prepare-spec-event-handler/websocket-schema";
import { WebSocketSchemaResourceProperties } from "./prepare-spec-event-handler/websocket-schema-handler";
import { WebSocketApiProps } from "./websocket/websocket-api-props";
import { WebSocketStageProps } from "./websocket/websocket-stage-props";

/**
 * Represents an integration for a route
 */
export interface TypeSafeWebsocketApiIntegration {
  /**
   * The integration to service the route
   */
  readonly integration: WebSocketRouteIntegration;
}

export interface WebsocketOperationDetails {
  /**
   * Path in the OpenAPI spec for the operation
   */
  readonly path: string;
}

export type WebsocketOperationLookup = {
  [operationId: string]: WebsocketOperationDetails;
};

/**
 * Properties for a Type Safe WebSocket API
 */
export interface TypeSafeWebsocketApiProps extends WebSocketApiProps {
  /**
   * Path to the websocket api specification json file
   */
  readonly specPath: string;
  /**
   * Details about each operation
   */
  readonly operationLookup: WebsocketOperationLookup;
  /**
   * WebSocket routes and their corresponding integrations
   */
  readonly integrations: {
    [operationId: string]: TypeSafeWebsocketApiIntegration;
  };
  /**
   * Integration for the $connect route (invoked when a new client connects)
   * @default mocked
   */
  readonly connect?: TypeSafeWebsocketApiIntegration;
  /**
   * Integration for the $disconnect route (invoked when a client disconnects)
   * @default mocked
   */
  readonly disconnect?: TypeSafeWebsocketApiIntegration;
  /**
   * Authorizer to use for the API (applied to the $connect route)
   * @default NONE
   */
  readonly authorizer?: IWebSocketRouteAuthorizer;
  /**
   * Options for the default stage
   */
  readonly stageProps?: WebSocketStageProps;
  /**
   * By default, all lambda integrations are granted management API access for the websocket API to send messages, disconnect clients, etc.
   * Set to true if you would like to manage these permissions manually.
   * @default false
   */
  readonly disableGrantManagementAccessToLambdas?: boolean;
  /**
   * By default, all mock integrations will automatically be configured with integration responses such that the integration is considered
   * successful. Set to true to disable this (mock integrations will respond with errors)
   * @default false
   */
  readonly disableMockIntegrationResponses?: boolean;
  /**
   * Disable access logging
   * @default false
   */
  readonly disableAccessLogging?: boolean;
}

/**
 * A construct for creating a websocket API, based on the provided spec and integrations
 */
export class TypeSafeWebsocketApi extends Construct {
  /**
   * Reference to the websocket API
   */
  public readonly api: WebSocketApi;
  /**
   * Reference to the default deploy stage
   */
  public readonly defaultStage: WebSocketStage;

  private readonly _props: TypeSafeWebsocketApiProps;

  constructor(scope: Construct, id: string, props: TypeSafeWebsocketApiProps) {
    super(scope, id);
    this._props = props;

    // Create the WebSocket API
    this.api = new WebSocketApi(this, id, {
      ...props,
      routeSelectionExpression: "$request.body.route",
    });

    // Add the connect/disconnect routes
    this.addRoute("$connect", {
      integration:
        props.connect?.integration ??
        new WebSocketMockIntegration("ConnectIntegration"),
      authorizer: props.authorizer,
    });
    const disconnectRoute = this.addRoute("$disconnect", {
      integration:
        props.connect?.integration ??
        new WebSocketMockIntegration("DisconnectIntegration"),
    });
    NagSuppressions.addResourceSuppressions(
      disconnectRoute,
      ["AwsPrototyping-APIGWAuthorization", "AwsSolutions-APIG4"].map(
        (ruleId) => ({
          id: ruleId,
          reason: `Authorizers only apply to the $connect route`,
        })
      ),
      true
    );

    // Create a default stage
    this.defaultStage = new WebSocketStage(this, "default", {
      webSocketApi: this.api,
      autoDeploy: true,
      stageName: "default",
      ...props.stageProps,
    });

    // Enable execution logs by default
    (this.defaultStage.node.defaultChild as CfnStage).defaultRouteSettings = {
      loggingLevel: "INFO",
      dataTraceEnabled: false,
    };

    // Enable access logging by default
    if (!props.disableAccessLogging) {
      const logGroup = new LogGroup(this, `AccessLogs`);
      (this.defaultStage.node.defaultChild as CfnStage).accessLogSettings = {
        destinationArn: logGroup.logGroupArn,
        format: `$context.identity.sourceIp - - [$context.requestTime] "$context.httpMethod $context.routeKey $context.protocol" $context.status $context.responseLength $context.requestId`,
      };
    }

    const lambdaHandlers: IFunction[] = [
      ...Object.values(props.integrations),
      props.connect,
      props.disconnect,
    ].flatMap((integration) =>
      integration?.integration instanceof WebSocketLambdaIntegration &&
      (integration.integration as any).handler?.grantPrincipal
        ? [(integration.integration as any).handler]
        : []
    );

    const stack = Stack.of(this);

    // By default, grant lambda handlers access to the management api
    if (!props.disableGrantManagementAccessToLambdas) {
      lambdaHandlers.forEach((fn) => {
        this.defaultStage.grantManagementApiAccess(fn);
        NagSuppressions.addResourceSuppressions(
          fn,
          ["AwsPrototyping-IAMNoWildcardPermissions", "AwsSolutions-IAM5"].map(
            (ruleId) => ({
              id: ruleId,
              reason:
                "WebSocket handlers are granted permissions to manage arbitrary connections",
              appliesTo: [
                {
                  regex: `/^Resource::arn:${PDKNag.getStackPartitionRegex(
                    stack
                  )}:execute-api:${PDKNag.getStackRegionRegex(
                    stack
                  )}:${PDKNag.getStackAccountRegex(stack)}:.*\\/${
                    this.defaultStage.stageName
                  }\\/\\*\\/@connections\\/\\*$/g`,
                },
              ],
            })
          ),
          true
        );
      });
    }

    // Where the same function is used for multiple routes, grant permission for API gateway to invoke
    // the lambda for all routes
    const uniqueLambdaHandlers = new Set<IFunction>();
    const duplicateLambdaHandlers = new Set<IFunction>();
    lambdaHandlers.forEach((fn) => {
      if (uniqueLambdaHandlers.has(fn)) {
        duplicateLambdaHandlers.add(fn);
      }
      uniqueLambdaHandlers.add(fn);
    });
    [...duplicateLambdaHandlers].forEach((fn, i) => {
      new CfnPermission(this, `GrantRouteInvoke${i}`, {
        action: "lambda:InvokeFunction",
        principal: "apigateway.amazonaws.com",
        functionName: fn.functionArn,
        sourceArn: stack.formatArn({
          service: "execute-api",
          resource: this.api.apiId,
          resourceName: "*",
        }),
      });
    });

    // Read and parse the spec
    const spec = JSON.parse(
      fs.readFileSync(props.specPath, "utf-8")
    ) as OpenAPIV3.Document;

    // Map of route key to paths
    const serverOperationPaths = Object.fromEntries(
      Object.values(props.operationLookup).map((details) => [
        details.path.replace(/\//g, ""),
        details.path,
      ])
    );

    // Locally check that we can extract the schema for every operation
    const schemas = extractWebSocketSchemas(
      Object.keys(serverOperationPaths),
      serverOperationPaths,
      spec
    );

    // Check that every operation has an integration
    const missingIntegrations = Object.keys(props.operationLookup).filter(
      (operationId) => !props.integrations[operationId]
    );
    if (missingIntegrations.length > 0) {
      throw new Error(
        `Missing integrations for operations ${missingIntegrations.join(", ")}`
      );
    }

    // Create an asset for the spec, which we'll read from the custom resource
    const inputSpec = new Asset(this, "InputSpec", {
      path: props.specPath,
    });

    // Function for managing schemas/models associated with routes
    const schemaHandler = new LambdaFunction(this, "SchemaHandler", {
      handler: "websocket-schema-handler.handler",
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(
        path.join(__dirname, "./prepare-spec-event-handler")
      ),
      timeout: Duration.minutes(1),
    });

    NagSuppressions.addResourceSuppressions(
      schemaHandler,
      ["AwsPrototyping-IAMNoManagedPolicies", "AwsSolutions-IAM4"].map(
        (ruleId) => ({
          id: ruleId,
          reason: `AWSLambdaBasicExecutionRole grants minimal permissions required for lambda execution`,
        })
      ),
      true
    );

    schemaHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [inputSpec.bucket.arnForObjects(inputSpec.s3ObjectKey)],
      })
    );

    schemaHandler.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "apigateway:DELETE",
          "apigateway:PATCH",
          "apigateway:POST",
          "apigateway:GET",
        ],
        resources: [
          stack.formatArn({
            service: "apigateway",
            account: "",
            resource: `/apis/${this.api.apiId}/models`,
          }),
          stack.formatArn({
            service: "apigateway",
            account: "",
            resource: `/apis/${this.api.apiId}/models/*`,
          }),
        ],
      })
    );
    schemaHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ["apigateway:PATCH", "apigateway:GET"],
        resources: [
          stack.formatArn({
            service: "apigateway",
            account: "",
            resource: `/apis/${this.api.apiId}/routes`,
          }),
          stack.formatArn({
            service: "apigateway",
            account: "",
            resource: `/apis/${this.api.apiId}/routes/*`,
          }),
        ],
      })
    );

    NagSuppressions.addResourceSuppressions(
      schemaHandler,
      ["AwsPrototyping-IAMNoWildcardPermissions", "AwsSolutions-IAM5"].map(
        (ruleId) => ({
          id: ruleId,
          reason: `Schema custom resource manages all routes and models`,
        })
      ),
      true
    );

    const providerRole = new Role(this, "PrepareSpecProviderRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        logs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: [
                `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/*`,
              ],
            }),
          ],
        }),
      },
    });

    const provider = new Provider(this, "SchemaProvider", {
      onEventHandler: schemaHandler,
      role: providerRole,
    });

    NagSuppressions.addResourceSuppressions(
      providerRole,
      ["AwsPrototyping-IAMNoWildcardPermissions", "AwsSolutions-IAM5"].map(
        (ruleId) => ({
          id: ruleId,
          reason: `Custom resource provider may invoke arbitrary lambda versions`,
        })
      ),
      true
    );
    NagSuppressions.addResourceSuppressions(
      provider,
      ["AwsPrototyping-LambdaLatestVersion", "AwsSolutions-L1"].map(
        (ruleId) => ({
          id: ruleId,
          reason: `Provider framework lambda is managed by CDK`,
        })
      ),
      true
    );

    const schemaCustomResourceProperties: WebSocketSchemaResourceProperties = {
      apiId: this.api.apiId,
      inputSpecLocation: {
        bucket: inputSpec.s3BucketName,
        key: inputSpec.s3ObjectKey,
      },
      serverOperationPaths,
    };

    const schemaCustomResource = new CustomResource(
      this,
      "SchemaCustomResource",
      {
        serviceToken: provider.serviceToken,
        properties: schemaCustomResourceProperties,
      }
    );

    // Add a route for every integration
    Object.entries(props.integrations).forEach(([operationId, integration]) => {
      const op = props.operationLookup[operationId];
      if (!op) {
        throw new Error(
          `Integration not found in operation lookup for operation ${operationId}`
        );
      }

      // Add the route
      const routeKey = op.path.replace(/\//g, "");
      const route = this.addRoute(routeKey, {
        integration: integration.integration,
      });
      NagSuppressions.addResourceSuppressions(
        route,
        ["AwsPrototyping-APIGWAuthorization", "AwsSolutions-APIG4"].map(
          (ruleId) => ({
            id: ruleId,
            reason: `Authorizers only apply to the $connect route`,
          })
        ),
        true
      );

      // Associate the route with its corresponding schema (which is created by the custom resource)
      if (schemas[routeKey]) {
        (route.node.defaultChild as CfnRoute).requestModels = {
          model: routeKey,
        };
        (route.node.defaultChild as CfnRoute).modelSelectionExpression =
          "model";
      }
      route.node.addDependency(schemaCustomResource);
    });
  }

  /**
   * Add a route to the websocket api
   */
  private addRoute(routeKey: string, options: WebSocketRouteOptions) {
    // Unless disableMockIntegrationResponses is true, we automatically configure the integration requests and responses
    // required to successfully mock the route, when the integration is a mock integration
    const shouldAddMockResponse =
      !this._props.disableMockIntegrationResponses &&
      options.integration instanceof WebSocketMockIntegration;

    const route = this.api.addRoute(routeKey, {
      ...options,
      returnResponse: shouldAddMockResponse,
    });

    if (
      shouldAddMockResponse &&
      ((options.integration as any)?.integration as WebSocketIntegration)
        ?.integrationId
    ) {
      const integration = (options.integration as any)
        ?.integration as WebSocketIntegration;
      (integration.node.defaultChild as CfnIntegration).requestTemplates = {
        "application/json": '{"statusCode":200}',
      };

      new CfnIntegrationResponse(this, `${routeKey}IntegRes`, {
        apiId: this.api.apiId,
        integrationId: integration.integrationId,
        integrationResponseKey: "/2\\d\\d/",
        templateSelectionExpression: "/2\\d\\d/",
        responseTemplates: {
          "200": '{"statusCode":200}',
        },
      });
    }

    return route;
  }
}
