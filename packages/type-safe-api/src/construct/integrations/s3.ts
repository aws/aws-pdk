/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { FeatureFlags } from "aws-cdk-lib";
import { Grant, IRole, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import * as perms from "aws-cdk-lib/aws-s3/lib/perms";
import * as cxapi from "aws-cdk-lib/cx-api";
import { IConstruct } from "constructs";
import { ErrorIntegrationResponse } from "./error-integration-response";
import { ErrorIntegrationResponses } from "./error-integration-responses";
import {
  ApiGatewayIntegration,
  Integration,
  IntegrationGrantProps,
  IntegrationRenderProps,
} from "./integration";
import { generateCorsResponseParameters } from "../prepare-spec-event-handler/prepare-spec";
import { Method } from "../spec";
import { bucketInvocationUri } from "../spec/utils";

export interface S3IntegrationProps {
  /**
   * The S3 bucket to be invoked on integration
   */
  readonly bucket: IBucket;

  /**
   * The HTTP method to use when invoking the S3 bucket
   * @default - integration method is used
   */
  readonly method?: Method;

  /**
   * The path override to use when invoking the S3 bucket
   * @default - integration path is used
   */
  readonly path?: string;

  /**
   * The error integration response to use when the S3 bucket returns an error
   * @default ErrorIntegrationResponses.catchAll()
   */
  readonly errorIntegrationResponse?: ErrorIntegrationResponse;
}

/**
 * An S3 integration
 * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-s3.html
 */
export class S3Integration extends Integration {
  private readonly bucket: IBucket;
  private readonly method?: Method;
  private readonly path?: string;
  private readonly errorIntegrationResponse?: ErrorIntegrationResponse;

  private readonly executionRoleId = "S3IntegrationsExecutionRole";

  constructor(props: S3IntegrationProps) {
    super();

    this.bucket = props.bucket;
    this.method = props.method;
    this.path = props.path;
    this.errorIntegrationResponse = props.errorIntegrationResponse;
  }

  private executionRole(scope: IConstruct): IRole {
    // Retrieve or create the shared S3 execution role
    return (scope.node.tryFindChild(this.executionRoleId) ??
      new Role(this.bucket, this.executionRoleId, {
        assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
      })) as IRole;
  }

  /**
   * Render the S3 integration as a snippet of OpenAPI
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      type: "AWS",
      httpMethod: (this.method ?? props.method).toUpperCase(),
      uri: bucketInvocationUri(this.bucket, this.path ?? props.path),
      credentials: this.executionRole(props.scope).roleArn,
      requestParameters: {
        // Add every path parameter to the integration request
        ...Object.fromEntries(
          [...props.path.matchAll(/\{([^\}]*)\}/g)]
            .map((m) => m[1])
            .map((param) => [
              `integration.request.path.${param}`,
              `method.request.path.${param}`,
            ])
        ),
      },
      responses: {
        default: {
          statusCode: "200",
          responseParameters: props.corsOptions
            ? generateCorsResponseParameters(props.corsOptions)
            : {},
          responseTemplates: {},
        },

        ...(
          this.errorIntegrationResponse ?? ErrorIntegrationResponses.catchAll()
        ).render(props),
      },
    };
  }

  /**
   * Grant API Gateway permissions to invoke the S3 bucket
   */
  public grant({ scope, method, path }: IntegrationGrantProps) {
    const grantMethod = this.method ?? method;
    let bucketActions: string[] = [];
    let keyActions: string[] = [];

    switch (grantMethod) {
      case "get":
      case "head":
      case "options":
      case "trace":
        bucketActions = perms.BUCKET_READ_ACTIONS;
        keyActions = perms.KEY_READ_ACTIONS;
        break;

      case "post":
      case "put":
      case "patch":
        bucketActions = FeatureFlags.of(scope).isEnabled(
          cxapi.S3_GRANT_WRITE_WITHOUT_ACL
        )
          ? perms.BUCKET_PUT_ACTIONS
          : perms.LEGACY_BUCKET_PUT_ACTIONS;
        keyActions = perms.KEY_WRITE_ACTIONS;
        break;

      case "delete":
        bucketActions = perms.BUCKET_DELETE_ACTIONS;
        break;
    }

    const executionRole = this.executionRole(scope);
    const grantPath = this.path ?? path;
    const permissionPath = grantPath.replace(/{[^\}]*\}/g, "*");

    Grant.addToPrincipalOrResource({
      grantee: executionRole,
      actions: bucketActions,
      resourceArns: [
        this.bucket.bucketArn,
        this.bucket.arnForObjects(permissionPath),
      ],
      resource: this.bucket,
    });

    if (this.bucket.encryptionKey) {
      this.bucket.encryptionKey.grant(executionRole, ...keyActions);
    }
  }
}
