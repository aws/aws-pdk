/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { Stack } from "aws-cdk-lib";
import { SpecRestApi } from "aws-cdk-lib/aws-apigateway";
import { CfnPermission, IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { MethodAndPath } from "../spec";
import { functionInvocationUri } from "../spec/utils";

/**
 * Specifies an API method integration type
 */
export type ApiGatewayIntegrationType =
  | "HTTP"
  | "HTTP_PROXY"
  | "AWS_PROXY"
  | "AWS"
  | "MOCK";

/**
 * The type of the network connection to the integration endpoint. The valid value is INTERNET for connections through
 * the public routable internet or VPC_LINK for private connections between API Gateway and a network load balancer in
 * a VPC. The default value is INTERNET.
 */
export type ApiGatewayIntegrationConnectionType = "VPC_LINK" | "INTERNET";

/**
 * Specifies how to handle request payload content type conversions.
 */
export type ApiGatewayIntegrationContentHandling =
  | "CONVERT_TO_TEXT"
  | "CONVERT_TO_BINARY";

/**
 * Specifies how the method request body of an unmapped content type will be passed through the integration request to
 * the back end without transformation.
 */
export type ApiGatewayIntegrationPassthroughBehaviour =
  | "WHEN_NO_MATCH"
  | "WHEN_NO_TEMPLATES"
  | "NEVER";

/**
 * API Gateway integration response
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration-response.html
 * @see https://docs.aws.amazon.com/apigateway/latest/api/API_Integration.html
 */
export interface ApiGatewayIntegrationResponse {
  /**
   * HTTP status code for the method response
   */
  readonly statusCode: string;
  /**
   * Specifies MIME type-specific mapping templates for the response’s payload.
   */
  readonly responseTemplates: { [mimeType: string]: string };
  /**
   * Specifies parameter mappings for the response.
   */
  readonly responseParameters: { [property: string]: string };
  /**
   * Response payload encoding conversion types. Valid values are 1) CONVERT_TO_TEXT, for converting a binary payload
   * into a base64-encoded string or converting a text payload into a utf-8-encoded string or passing through the text
   * payload natively without modification, and 2) CONVERT_TO_BINARY, for converting a text payload into a
   * base64-decoded blob or passing through a binary payload natively without modification.
   */
  readonly contentHandling?: ApiGatewayIntegrationContentHandling;
}

/**
 * Specifies the TLS configuration for an integration
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-extensions-integration-tls-config.html
 */
export interface ApiGatewayIntegrationTlsConfig {
  /**
   * Specifies whether or not API Gateway skips verification that the certificate for an integration endpoint is issued
   * by a supported certificate authority. This isn’t recommended, but it enables you to use certificates that are
   * signed by private certificate authorities, or certificates that are self-signed. If enabled, API Gateway still
   * performs basic certificate validation, which includes checking the certificate's expiration date, hostname, and
   * presence of a root certificate authority. Supported only for HTTP and HTTP_PROXY integrations.
   */
  readonly insecureSkipVerification?: boolean;
}

/**
 * Represents an api gateway integration
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html
 */
export interface ApiGatewayIntegration {
  /**
   * The type of integration with the specified backend.
   * @see https://docs.aws.amazon.com/apigateway/latest/api/API_Integration.html#type
   */
  readonly type?: ApiGatewayIntegrationType;
  /**
   * The endpoint URI of the backend. For integrations of the aws type, this is an ARN value.
   * For the HTTP integration, this is the URL of the HTTP endpoint including the https or http scheme.
   */
  readonly uri?: string;
  /**
   * A list of request parameters whose values are to be cached.
   */
  readonly cacheKeyParameters?: string[];
  /**
   * An API-specific tag group of related cached parameters.
   */
  readonly cacheNamespace?: string;
  /**
   * The ID of a VpcLink for the private integration.
   * @see https://docs.aws.amazon.com/apigateway/latest/api/API_VpcLink.html
   */
  readonly connectionId?: string;
  /**
   * The integration connection type. The valid value is "VPC_LINK" for private integration or "INTERNET", otherwise.
   */
  readonly connectionType?: ApiGatewayIntegrationConnectionType;
  /**
   * For AWS IAM role-based credentials, specify the ARN of an appropriate IAM role. If unspecified, credentials default
   * to resource-based permissions that must be added manually to allow the API to access the resource. For more
   * information, see Granting Permissions Using a Resource Policy.
   *
   * Note: When using IAM credentials, make sure that AWS STS Regional endpoints are enabled for the Region where this
   * API is deployed for best performance.
   */
  readonly credentials?: string;
  /**
   * Request payload encoding conversion types. Valid values are 1) CONVERT_TO_TEXT, for converting a binary payload
   * into a base64-encoded string or converting a text payload into a utf-8-encoded string or passing through the text
   * payload natively without modification, and 2) CONVERT_TO_BINARY, for converting a text payload into a
   * base64-decoded blob or passing through a binary payload natively without modification.
   */
  readonly contentHandling?: ApiGatewayIntegrationContentHandling;
  /**
   * The HTTP method used in the integration request. For Lambda function invocations, the value must be POST.
   */
  readonly httpMethod?: string;
  /**
   * Specifies how a request payload of unmapped content type is passed through the integration request without
   * modification. Supported values are when_no_templates, when_no_match, and never.
   * @see https://docs.aws.amazon.com/apigateway/latest/api/API_Integration.html#passthroughBehavior
   */
  readonly passthroughBehavior?: ApiGatewayIntegrationPassthroughBehaviour;
  /**
   * Specifies mappings from method request parameters to integration request parameters. Supported request parameters
   * are querystring, path, header, and body.
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration-requestParameters.html
   */
  readonly requestParameters?: { [property: string]: string };
  /**
   * Mapping templates for a request payload of specified MIME types.
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration-requestTemplates.html
   */
  readonly requestTemplates?: { [mimeType: string]: string };
  /**
   * Defines the method's responses and specifies desired parameter mappings or payload mappings from integration
   * responses to method responses.
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration-responses.html
   */
  readonly responses?: {
    [responseStatusPattern: string]: ApiGatewayIntegrationResponse;
  };
  /**
   * Custom timeout between 50 and 29,000 milliseconds. The default value is 29,000 milliseconds or 29 seconds.
   */
  readonly timeoutInMillis?: number;
  /**
   * Specifies the TLS configuration for an integration.
   * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-extensions-integration-tls-config.html
   */
  readonly tlsConfig?: ApiGatewayIntegrationTlsConfig;
}

/**
 * Properties for rendering an integration into an API Gateway OpenAPI extension
 */
export interface IntegrationRenderProps extends MethodAndPath {
  /**
   * The ID of the operation being rendered
   */
  readonly operationId: string;
  /**
   * The scope in which the integration is being rendered
   */
  readonly scope: Construct;
}

/**
 * Properties for granting the API access to invoke the operation
 */
export interface IntegrationGrantProps extends MethodAndPath {
  /**
   * The ID of the operation for which permissions are being granted
   */
  readonly operationId: string;
  /**
   * The scope in which permission resources can be created
   */
  readonly scope: Construct;
  /**
   * The api to grant permissions for
   */
  readonly api: SpecRestApi;
}

/**
 * An integration for an API operation. You can extend this to implement your own integration if you like.
 */
export abstract class Integration {
  /**
   * Render the integration into an API Gateway OpenAPI extension
   */
  public abstract render(props: IntegrationRenderProps): ApiGatewayIntegration;
  /**
   * Grant permissions for the API to invoke the integration
   */
  public grant(_props: IntegrationGrantProps) {
    // No permissions to grant by default
  }
}

/**
 * A lambda integration
 */
export class LambdaIntegration extends Integration {
  private readonly lambdaFunction: IFunction;

  constructor(lambdaFunction: IFunction) {
    super();
    this.lambdaFunction = lambdaFunction;
  }

  /**
   * Render the lambda integration as a snippet of OpenAPI
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      type: "AWS_PROXY",
      httpMethod: "POST",
      uri: functionInvocationUri(props.scope, this.lambdaFunction),
      passthroughBehavior: "WHEN_NO_MATCH",
    };
  }

  /**
   * Grant API Gateway permissions to invoke the lambda
   */
  public grant({
    scope,
    api,
    operationId,
    method,
    path,
  }: IntegrationGrantProps) {
    new CfnPermission(scope, `LambdaPermission-${operationId}`, {
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      functionName: this.lambdaFunction.functionArn,
      sourceArn: Stack.of(scope).formatArn({
        service: "execute-api",
        resource: api.restApiId,
        // Scope permissions to any stage and a specific method and path of the operation.
        // Path parameters (eg {param} are replaced with wildcards)
        resourceName: `*/${method.toUpperCase()}${path.replace(
          /{[^\}]*\}/g,
          "*"
        )}`,
      }),
    });
  }
}

/**
 * A collection of integrations to connect API operations with a backend to service requests
 */
export class Integrations {
  /**
   * An integration that invokes a lambda function to service the request
   * @param lambdaFunction the function to invoke
   */
  public static lambda(lambdaFunction: IFunction): LambdaIntegration {
    return new LambdaIntegration(lambdaFunction);
  }
}
