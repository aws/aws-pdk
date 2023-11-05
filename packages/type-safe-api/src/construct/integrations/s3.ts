/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
import { FeatureFlags, Stack } from "aws-cdk-lib";
import {
  CompositePrincipal,
  Grant,
  IRole,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import * as perms from "aws-cdk-lib/aws-s3/lib/perms";
import * as cxapi from "aws-cdk-lib/cx-api";
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
   * The IAM role to be used to grant permissions to the API Gateway to invoke the S3 bucket
   * @default - a new role will be created
   */
  readonly role?: IRole;

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
  private readonly role: IRole;
  private readonly method?: Method;
  private readonly path?: string;
  private readonly errorIntegrationResponse?: ErrorIntegrationResponse;

  constructor(props: S3IntegrationProps) {
    super();

    this.bucket = props.bucket;

    if (props.role) {
      this.role = props.role;
    } else {
      this.role = (this.bucket.node.tryFindChild("ExecutionRole") ??
        new Role(this.bucket, "ExecutionRole", {
          assumedBy: new CompositePrincipal(),
        })) as IRole;
    }

    this.method = props.method;
    this.path = props.path;
    this.errorIntegrationResponse = props.errorIntegrationResponse;
  }

  /**
   * Render the S3 integration as a snippet of OpenAPI
   */
  public render(props: IntegrationRenderProps): ApiGatewayIntegration {
    return {
      type: "AWS",
      httpMethod: (this.method ?? props.method).toUpperCase(),
      uri: bucketInvocationUri(this.bucket, this.path ?? props.path),
      credentials: this.role.roleArn,
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
  public grant({ scope, api, method, path }: IntegrationGrantProps) {
    this.role.grant(
      new ServicePrincipal("apigateway.amazonaws.com", {
        conditions: {
          "ForAnyValue:StringEquals": {
            "aws.SourceArn": Stack.of(scope).formatArn({
              service: "execute-api",
              resource: api.restApiId,
              // Scope permissions to any stage and a specific method and path of the operation.
              // Path parameters (eg {param} are replaced with wildcards)
              resourceName: `*/${method.toUpperCase()}${path.replace(
                /{[^\}]*\}/g,
                "*"
              )}`,
            }),
          },
        },
      })
    );

    const bucketMethod = this.method ?? method;

    var bucketActions: string[] = [];
    var keyActions: string[] = [];

    switch (bucketMethod) {
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

    Grant.addToPrincipalOrResource({
      grantee: this.role,
      actions: bucketActions,
      resourceArns: [
        this.bucket.bucketArn,
        this.bucket.arnForObjects(this.path ?? path),
      ],
      resource: this.bucket,
    });

    if (this.bucket.encryptionKey) {
      this.bucket.encryptionKey.grant(this.role, ...keyActions);
    }
  }
}
